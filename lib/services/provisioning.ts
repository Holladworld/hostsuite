import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getHostingProvider } from '@/lib/providers';
import type { ProviderResult } from '@/lib/providers/types';

type ServiceInstance = {
  id: string;
  user_id: string;
  service_type: string;
  service_name: string;
  status: string;
  provider: string | null;
  configuration: Record<string, unknown> | null;
  provider_resource_id: string | null;
};

type ProvisionOutcome =
  | { ok: true; status: 'active'; providerResourceId?: string; controlPanelUrl?: string; webmailUrl?: string }
  | { ok: false; status: 'provisioning_failed'; code: string; message: string };

function failure(result: ProviderResult<unknown>): ProvisionOutcome {
  if (result.ok) throw new Error('Expected provider failure result.');
  return { ok: false, status: 'provisioning_failed', code: result.code, message: result.message };
}

function stringConfig(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function provisionOne(instance: ServiceInstance): Promise<ProvisionOutcome> {
  const provider = getHostingProvider();
  const config = instance.configuration ?? {};

  if (instance.service_type === 'hosting') {
    const domain = stringConfig(config, 'domain');
    const planRef = stringConfig(config, 'planRef') ?? stringConfig(config, 'plan_id');
    if (!domain || !planRef) return { ok: false, status: 'provisioning_failed', code: 'INVALID_CONFIGURATION', message: 'Hosting requires a domain and hosting plan.' };

    const result = await provider.provisionHosting({ customerId: instance.user_id, domain, planRef });
    if (!result.ok) return failure(result);

    const panel = await provider.getControlPanelUrl(result.data.externalId);
    return {
      ok: true,
      status: 'active',
      providerResourceId: result.data.externalId,
      ...(panel.ok ? { controlPanelUrl: panel.data.url } : {}),
    };
  }

  if (instance.service_type === 'email') {
    const domain = stringConfig(config, 'domain');
    const addresses = Array.isArray(config.emailAddresses)
      ? config.emailAddresses.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];
    if (!domain || addresses.length === 0) return { ok: false, status: 'provisioning_failed', code: 'INVALID_CONFIGURATION', message: 'Email requires a domain and at least one email address.' };

    const resources: string[] = [];
    for (const mailbox of addresses) {
      const localPart = mailbox.includes('@') ? mailbox.slice(0, mailbox.indexOf('@')) : mailbox;
      const result = await provider.createMailbox({ customerId: instance.user_id, domain, mailbox: localPart });
      if (!result.ok) return failure(result);
      resources.push(result.data.externalId);
    }

    const webmail = resources[0] ? await provider.getWebmailUrl(resources[0]) : null;
    return {
      ok: true,
      status: 'active',
      providerResourceId: JSON.stringify(resources),
      ...(webmail?.ok ? { webmailUrl: webmail.data.url } : {}),
    };
  }

  return { ok: false, status: 'provisioning_failed', code: 'NOT_SUPPORTED', message: `Provisioning for ${instance.service_type} is not implemented by the current provider adapter.` };
}

export async function provisionServiceInstance(serviceInstanceId: string): Promise<ProvisionOutcome> {
  const admin = createAdminSupabaseClient();
  const { data: instance, error: fetchError } = await admin
    .from('service_instances')
    .select('id,user_id,service_type,service_name,status,provider,configuration,provider_resource_id')
    .eq('id', serviceInstanceId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!instance) return { ok: false, status: 'provisioning_failed', code: 'NOT_FOUND', message: 'Service instance not found.' };
  if (instance.status === 'active') return { ok: true, status: 'active', providerResourceId: instance.provider_resource_id ?? undefined };
  if (instance.status !== 'paid' && instance.status !== 'provisioning_failed') return { ok: false, status: 'provisioning_failed', code: 'INVALID_STATE', message: `Service is ${instance.status} and cannot be provisioned.` };

  const { data: attemptNo, error: beginError } = await admin.rpc('begin_service_provisioning', { p_service_instance_id: serviceInstanceId });
  if (beginError) throw beginError;
  if (attemptNo === null) return { ok: false, status: 'provisioning_failed', code: 'BUSY', message: 'Provisioning is already in progress or the service is not ready.' };

  try {
    const outcome = await provisionOne(instance as ServiceInstance);
    const now = new Date().toISOString();

    if (!outcome.ok) {
      await admin.from('service_instances').update({ status: 'provisioning_failed', last_error: `${outcome.code}: ${outcome.message}` }).eq('id', serviceInstanceId);
      await admin.from('provisioning_attempts').update({ status: 'failed', error_code: outcome.code, error_message: outcome.message, finished_at: now }).eq('service_instance_id', serviceInstanceId).eq('attempt_no', attemptNo);
      return outcome;
    }

    await admin.from('service_instances').update({
      status: 'active',
      provider_resource_id: outcome.providerResourceId ?? null,
      control_panel_url: outcome.controlPanelUrl ?? null,
      provider_status: 'active',
      last_error: null,
      provisioned_at: now,
    }).eq('id', serviceInstanceId);

    await admin.from('provisioning_attempts').update({ status: 'succeeded', finished_at: now }).eq('service_instance_id', serviceInstanceId).eq('attempt_no', attemptNo);
    return outcome;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected provisioning error.';
    const now = new Date().toISOString();
    await admin.from('service_instances').update({ status: 'provisioning_failed', last_error: `PROVIDER_ERROR: ${message}` }).eq('id', serviceInstanceId);
    await admin.from('provisioning_attempts').update({ status: 'failed', error_code: 'PROVIDER_ERROR', error_message: message, finished_at: now }).eq('service_instance_id', serviceInstanceId).eq('attempt_no', attemptNo);
    return { ok: false, status: 'provisioning_failed', code: 'PROVIDER_ERROR', message };
  }
}
