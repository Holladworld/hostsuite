import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SERVICES } from '@/lib/constants';

const destinations = [
  '/services',
  '/portal/ai-builder',
  '/services#email-deliverability',
  '/#diagnostic',
  '/services#zero-downtime-migration',
  '/services#managed-servers',
  '/#diagnostic',
];

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-[#F5F1EA] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20 lg:px-12">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[#80688B]">What we take care of</p>
          <h2 className="mt-5 max-w-[11ch] font-display text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-[#24132F] sm:text-5xl">
            The important parts of being online.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[#665D69]">
            Start with one service or bring the whole setup. We help you get online, keep things working and make changes when your business grows.
          </p>
          <Link href="/services" className="mt-8 inline-flex items-center gap-2 border-b border-[#A996B0] pb-2 text-sm font-semibold text-[#4A1F6B] hover:border-[#4A1F6B]">
            View service details <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="border-t border-[#D9D0DD]">
          {SERVICES.map((service, index) => (
            <Link
              key={service.title}
              href={destinations[index] ?? '/services'}
              className="group grid gap-3 border-b border-[#D9D0DD] py-6 transition-colors hover:bg-white/55 sm:grid-cols-[3rem_1fr_auto] sm:gap-5 sm:px-3"
            >
              <span className="pt-1 font-mono-data text-xs text-[#8B7793]">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <span className="block font-display text-2xl font-normal leading-tight text-[#24132F] sm:text-[1.8rem]">{service.title}</span>
                <span className="mt-2 block max-w-2xl text-sm leading-6 text-[#6C6470]">{service.description}</span>
                <span className="mt-3 block font-mono-data text-[10px] uppercase tracking-[0.1em] text-[#8B7793]">
                  {service.bullets.join('  /  ')}
                </span>
              </span>
              <ArrowUpRight className="mt-1 h-4 w-4 text-[#8B7793] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#4A1F6B]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
