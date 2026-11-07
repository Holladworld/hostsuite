'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING, waLink } from '@/lib/constants';
import { formatNaira } from '@/lib/format';
import { useSiteSettings } from '@/hooks/use-content';

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { settings } = useSiteSettings();

  const plans = PRICING.map((plan) => {
    if (plan.id === 'starter_ops') return { ...plan, monthly: settings.pricing?.starter_ops_monthly ?? plan.monthly, annual: settings.pricing?.starter_ops_annual ?? plan.annual };
    if (plan.id === 'managed_growth') return { ...plan, monthly: settings.pricing?.managed_growth_monthly ?? plan.monthly, annual: settings.pricing?.managed_growth_annual ?? plan.annual };
    return plan;
  });

  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[#80688B]">Website care & support</p>
            <h2 className="mt-5 max-w-[10ch] font-display text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-[#24132F] sm:text-5xl">
              The right level of care. Nothing you do not need.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <p className="max-w-lg text-sm leading-7 text-[#6C6470] lg:text-right">
              Choose the level of support that suits your business today. Need a one-off fix, a steady pair of hands or full website care? Start with what you need—not a bigger package.
            </p>
            <div className="inline-flex border-b border-[#D9D0DD]">
              <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${!annual ? 'border-[#4A1F6B] text-[#4A1F6B]' : 'border-transparent text-[#756C79] hover:text-[#24132F]'}`}>Monthly</button>
              <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${annual ? 'border-[#4A1F6B] text-[#4A1F6B]' : 'border-transparent text-[#756C79] hover:text-[#24132F]'}`}>Annual</button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#D9D0DD]">
          {plans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            const isCustom = price === null;
            const annualSaving = plan.monthly !== null && plan.annual !== null && plan.monthly > 0 ? Math.round((1 - plan.annual / (plan.monthly * 12)) * 100) : 0;

            return (
              <article key={plan.id} className="grid gap-6 border-b border-[#D9D0DD] py-8 lg:grid-cols-[0.85fr_0.7fr_1.5fr_auto] lg:items-start lg:gap-8">
                <div>
                  {plan.popular && <p className="mb-2 font-mono-data text-[10px] font-semibold uppercase tracking-[0.16em] text-[#79568B]">Recommended</p>}
                  <h3 className="font-display text-2xl font-normal leading-tight text-[#24132F]">{plan.name}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#756C79]">{plan.tagline}</p>
                </div>
                <div>
                  {isCustom ? <p className="font-display text-2xl text-[#24132F]">Custom quote</p> : (
                    <>
                      <p className="font-mono-data text-2xl font-medium tracking-tight text-[#24132F] sm:text-3xl">{formatNaira(price)}</p>
                      <p className="mt-1 text-xs text-[#756C79]">per {annual ? 'year' : 'month'}</p>
                      {annual && annualSaving > 0 && <p className="mt-2 text-xs font-semibold text-[#4A1F6B]">Save {annualSaving}% against monthly billing</p>}
                    </>
                  )}
                </div>
                <ul className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-[#5F5663]"><span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#79568B]" />{feature}</li>)}
                </ul>
                <div className="lg:pt-1">
                  <Button asChild className="h-11 w-full rounded-none bg-[#4A1F6B] px-5 text-white hover:bg-[#351449] lg:w-auto">
                    <a href={waLink(`Hello HostSuite, I am interested in the ${plan.name} plan${isCustom ? ' and would like a custom quote' : ''}. Please help me understand whether it covers my website management needs.`)} target="_blank" rel="noopener noreferrer" className="gap-2">
                      {isCustom ? 'Request a quote' : 'Discuss this plan'} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-xs leading-6 text-[#817784]">
          Need a one-off fix or something outside these plans? <Link href="/#diagnostic" className="font-semibold text-[#4A1F6B] underline underline-offset-4">Tell us what is happening</Link> and we will help you find the right next step.
        </p>
      </div>
    </section>
  );
}
