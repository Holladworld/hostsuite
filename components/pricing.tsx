'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRICING, waLink } from '@/lib/constants';
import { formatNaira } from '@/lib/format';

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative scroll-mt-20 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-20" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            Managed Service Pricing
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Plans that scale with your operations
          </h2>
          <p className="mt-3 text-muted-foreground">
            Transparent monthly or annual pricing. No setup fees. Cancel anytime — but you will not want to.
          </p>

          {/* Toggle */}
          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                annual ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-success/15 text-success'
              }`}>
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {PRICING.map((plan, i) => {
            const price = annual ? plan.annual : plan.monthly;
            const isCustom = price === null;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg ${
                  plan.popular
                    ? 'border-primary/40 shadow-primary/10 lg:-translate-y-2 lg:scale-[1.02]'
                    : 'border-border hover:border-primary/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                      <Star className="mr-1 h-3 w-3 fill-current" /> MOST POPULAR
                    </Badge>
                  </div>
                )}

                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                </div>

                <div className="mt-5 flex items-end gap-1">
                  {isCustom ? (
                    <span className="font-display text-3xl font-bold text-foreground">Custom Quote</span>
                  ) : (
                    <>
                      <span className="font-mono-data text-4xl font-bold text-foreground">
                        {formatNaira(price)}
                      </span>
                      <span className="mb-1 text-sm text-muted-foreground">
                        /{annual ? 'yr' : 'mo'}
                      </span>
                    </>
                  )}
                </div>
                {annual && !isCustom && plan.monthly !== null && plan.annual !== null && (
                  <p className="mt-1 text-xs text-success">
                    You save {formatNaira(plan.monthly * 12 - plan.annual)} vs monthly
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`mt-7 w-full ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-primary/30 bg-background text-primary hover:bg-primary/5'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <a
                    href={waLink(
                      `Hello HostSuite, I am interested in the ${plan.name} plan${isCustom ? ' and would like a custom quote' : ''}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    {isCustom ? 'Request Custom Quote' : 'Get Started'}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Free migration included
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
