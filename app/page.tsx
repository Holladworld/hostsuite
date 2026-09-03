import { Suspense } from 'react';
import { SiteShell } from '@/components/site-shell';
import { Hero } from '@/components/hero';
import { PromoBanner } from '@/components/promo-banner';
import { Services } from '@/components/services';
import { DiagnosticTool } from '@/components/diagnostic-tool';
import { Pricing } from '@/components/pricing';
import { CreditOffsetBanner } from '@/components/credit-offset-banner';

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <PromoBanner />
      <Services />
      <Suspense fallback={null}>
        <DiagnosticTool />
      </Suspense>
      <CreditOffsetBanner />
      <Pricing />
    </SiteShell>
  );
}
