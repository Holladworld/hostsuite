import { ArrowUpRight } from 'lucide-react';
import { waLink } from '@/lib/constants';

export function CreditOffsetBanner() {
  return (
    <section className="border-y border-[#D8CFC4] bg-[#EAE3D9] py-12 sm:py-14">
      <div className="mx-auto grid max-w-7xl gap-7 px-5 sm:px-8 md:grid-cols-[1fr_auto] md:items-center lg:px-12">
        <div>
          <p className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[#956D58]">When it is time to move</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-normal leading-tight text-[#211B1D] sm:text-4xl">
            You do not have to change hosts to get better website management.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#69615C] sm:text-base">
            Keep your current hosting if it works for you. If a move makes sense later, ask us about the Credit Offset Program and whether your unused paid term can be matched when you switch.
          </p>
        </div>
        <a href={waLink('Hello HostSuite, I would like advice about managing my existing website and whether I need to change hosting.')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-3 border border-[#6D4438] bg-[#6D4438] px-6 text-sm font-semibold text-white transition hover:bg-[#4F3028]">
          Talk through my options <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
