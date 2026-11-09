'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING, waLink } from '@/lib/constants';
import { formatNaira } from '@/lib/format';
import { useSiteSettings } from '@/hooks/use-content';

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const reduceMotion = useReducedMotion();
  const { settings } = useSiteSettings();

  const plans = PRICING.map((plan) => {
    if (plan.id === 'starter_ops') return { ...plan, monthly: settings.pricing?.starter_ops_monthly ?? plan.monthly, annual: settings.pricing?.starter_ops_annual ?? plan.annual };
    if (plan.id === 'managed_growth') return { ...plan, monthly: settings.pricing?.managed_growth_monthly ?? plan.monthly, annual: settings.pricing?.managed_growth_annual ?? plan.annual };
    return plan;
  });

  return (
    <section id="pricing" className="scroll-mt-20 bg-[#FFFFFF] py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-9 lg:px-16 xl:px-24">
        <div className="grid gap-8 border-b border-[#E5DCEC] pb-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#93634D]">Website care &amp; support</p>
            <h2 className="mt-6 max-w-[650px] font-display text-[clamp(3rem,5.4vw,5.8rem)] leading-[0.9] tracking-[-0.06em] text-[#281936]">The right level of care. <em className="font-normal text-[#6D3AA0]">Nothing extra.</em></h2>
          </div>
          <div className="flex flex-col items-start gap-5 lg:items-end">
            <p className="max-w-[490px] text-sm leading-7 text-[#71657B] lg:text-right">Choose the support that suits your business today. Need a one-off fix, a steady pair of hands or full website care? Start with what you need—not a bigger package.</p>
            <div className="inline-flex border-b border-[#E5DCEC]">
              <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual} className={`border-b-2 px-4 py-3 text-xs font-semibold transition ${!annual ? 'border-[#5D2A86] text-[#5D2A86]' : 'border-transparent text-[#8A7E93] hover:text-[#281936]'}`}>Monthly</button>
              <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual} className={`border-b-2 px-4 py-3 text-xs font-semibold transition ${annual ? 'border-[#5D2A86] text-[#5D2A86]' : 'border-transparent text-[#8A7E93] hover:text-[#281936]'}`}>Annual</button>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-[#E5DCEC]">
          {plans.map((plan, index) => {
            const price = annual ? plan.annual : plan.monthly;
            const isCustom = price === null;
            const annualSaving = plan.monthly !== null && plan.annual !== null && plan.monthly > 0 ? Math.round((1 - plan.annual / (plan.monthly * 12)) * 100) : 0;
            return (
              <motion.article key={plan.id} initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.05 }} className="grid gap-6 border-b border-[#E5DCEC] py-8 lg:grid-cols-[0.85fr_0.7fr_1.5fr_auto] lg:items-start lg:gap-8">
                <div>
                  {plan.popular && <p className="mb-2 font-mono-data text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6D3AA0]">Recommended</p>}
                  <h3 className="font-display text-2xl leading-tight tracking-[-0.04em] text-[#281936]">{plan.name}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#71657B]">{plan.tagline}</p>
                </div>
                <div>
                  {isCustom ? <p className="font-display text-2xl text-[#281936]">Custom quote</p> : <>
                    <p className="font-mono-data text-2xl font-medium tracking-tight text-[#281936] sm:text-3xl">{formatNaira(price)}</p>
                    <p className="mt-1 text-xs text-[#8A7E93]">per {annual ? 'year' : 'month'}</p>
                    {annual && annualSaving > 0 && <p className="mt-2 text-xs font-semibold text-[#5D2A86]">Save {annualSaving}% against monthly billing</p>}
                  </>}
                </div>
                <ul className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-[#71657B]"><span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#6D3AA0]" />{feature}</li>)}
                </ul>
                <div className="lg:pt-1">
                  <Button asChild className="h-11 w-full rounded-none bg-[#281936] px-5 text-white hover:bg-[#5D2A86] lg:w-auto">
                    {isCustom ? (
                      <a href={waLink(`Hello HostSuite, I am interested in the ${plan.name} plan and would like a custom quote. Please help me discuss the scope and pricing.`)} target="_blank" rel="noopener noreferrer" className="gap-2">Request a quote <ArrowUpRight className="h-4 w-4" /></a>
                    ) : (
                      <Link href={`/portal/managed-plan?plan=${plan.id}&interval=${annual ? 'yearly' : 'monthly'}`} className="gap-2">Choose this plan <ArrowUpRight className="h-4 w-4" /></Link>
                    )}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
        <p className="mt-6 text-xs leading-6 text-[#8A7E93]">Need a one-off fix or something outside these plans? <Link href="/#diagnostic" className="font-semibold text-[#5D2A86] underline underline-offset-4">Tell us what is happening</Link> and we will help you find the right next step.</p>
      </div>
    </section>
  );
}
