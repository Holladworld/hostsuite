import { Suspense } from 'react';
import { SiteShell } from '@/components/site-shell';
import { Hero } from '@/components/hero';
import { ServiceImageCarousel } from '@/components/service-image-carousel';
import { PromoBanner } from '@/components/promo-banner';
import { Services } from '@/components/services';
import { DiagnosticTool } from '@/components/diagnostic-tool';
import { Pricing } from '@/components/pricing';
import { CreditOffsetBanner } from '@/components/credit-offset-banner';

export default function Home() {
  return (
    <SiteShell>
      <PromoBanner />
      <Hero />
      <ServiceImageCarousel />
      <Services />
      <Suspense fallback={null}>
        <DiagnosticTool />
      </Suspense>
      <CreditOffsetBanner />
      <Pricing />
    </SiteShell>
  );
}
