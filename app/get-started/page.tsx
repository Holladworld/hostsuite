import { SiteShell } from '@/components/site-shell';
import { ServiceDiscovery } from '@/components/service-discovery';

export default function GetStartedPage() {
  return (
    <SiteShell>
      <ServiceDiscovery />
    </SiteShell>
  );
}
