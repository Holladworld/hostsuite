import type { SupabaseClient } from '@supabase/supabase-js';
import { getHostingProvider } from '@/lib/providers';
import type { ProviderResult } from '@/lib/providers/types';

type ServiceInstance = {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  provider: string | null;
  provider_resource_id: string | null;
  config: Record<string, unknown>;
};

function messageFromProvider<T>(result: ProviderResult<T>) {
  return result.ok ? null : result.message;
}

export async function provisionServiceInstance(
  admin: SupabaseClient,
  instanceId: string,
) {
  const { data: instance, error } = await admin
    .from('service_instances')
    .select('id,user_id,service_type,status,provider,provider_resource_id,config')
    .eq('id', instanceId)
    .single<ServiceInstance>();

  if (error || !instance) throw new Error('Service instance not found.');
  if (instance.status === 'active') return { status: 'active' as const, instance };
  if (instance.status === 'cancelled' || instance.status === 'suspended') {
    return { status: instance.status, instance };
  }

  await admin.from('service_instances').update({
    status: 'provisioning',
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', instance.id);

  try {
    if (instance.service_type === 'hosting') {
      const domain = typeof instance.config.domain === 'string' ? instance.config.domain : '';
      const planRef = typeof instance.config.planRef === 'string' ? instance.config.planRef : '';
      if (!domain || !planRef) throw new Error('Hosting domain and plan reference are required before provisioning.');

      const provider = getHostingProvider();
      if (!provider.capabilities.includes('hosting.provision')) {
        throw new Error(`Provider ${provider.name} does not support hosting provisioning.`);
      }
      const result = await provider.provisionHosting({ customerId: instance.user_id, domain, planRef });
      const providerError = messageFromProvider(result);
      if (providerError) throw new Error(providerError);
      if (!result.ok || !result.data.externalId) throw new Error('Provider did not return a hosting resource ID.');

      await admin.from('service_instances').update({
        status: 'active',
        provider: provider.name,
        provider_resource_id: result.data.externalId,
        provisioned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
      return { status: 'active' as const, provider: provider.name, providerResourceId: result.data.externalId };
    }

    if (instance.service_type === 'email') {
      const domain = typeof instance.config.domain === 'string' ? instance.config.domain : '';
      const mailbox = typeof instance.config.mailbox === 'string' ? instance.config.mailbox : '';
      if (!domain || !mailbox) throw new Error('Email domain and mailbox are required before provisioning.');

      const provider = getHostingProvider();
      if (!provider.capabilities.includes('email.mailbox')) {
        throw new Error(`Provider ${provider.name} does not support mailbox provisioning.`);
      }
      const result = await provider.createMailbox({ customerId: instance.user_id, domain, mailbox });
      const providerError = messageFromProvider(result);
      if (providerError) throw new Error(providerError);
      if (!result.ok || !result.data.externalId) throw new Error('Provider did not return a mailbox resource ID.');

      await admin.from('service_instances').update({
        status: 'active',
        provider: provider.name,
        provider_resource_id: result.data.externalId,
        provisioned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
      return { status: 'active' as const, provider: provider.name, providerResourceId: result.data.externalId };
    }

    // Internal HostSuite services do not need an external provider resource yet.
    // Marking them active does not invent an external account or credential.
    await admin.from('service_instances').update({
      status: 'active',
      provider: 'hostsuite',
      provisioned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', instance.id);
    return { status: 'active' as const, provider: 'hostsuite' };
  } catch (error) {
    const lastError = error instanceof Error ? error.message : 'Provisioning failed.';
    await admin.from('service_instances').update({
      status: 'provisioning_failed',
      last_error: lastError,
      updated_at: new Date().toISOString(),
    }).eq('id', instance.id);
    return { status: 'provisioning_failed' as const, error: lastError };
  }
}
