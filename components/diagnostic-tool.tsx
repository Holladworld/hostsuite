'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Clock,
  BadgeDollarSign,
  Mail,
  Phone,
  Building2,
  Globe,
  UserX,
  MailWarning,
  GaugeCircle,
  Wrench,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PAIN_POINTS, waLink, type PainPoint } from '@/lib/constants';
import { formatNairaRange, formatTurnaround } from '@/lib/format';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

const painIconMap: Record<string, React.ElementType> = {
  UserX,
  MailWarning,
  GaugeCircle,
  BadgeDollarSign,
  Wrench,
};

type Step = 1 | 2 | 3;

export function DiagnosticTool() {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const searchParams = useSearchParams();

  // Pre-select a pain point when navigated with ?issue=<painId>
  useEffect(() => {
    const issue = searchParams.get('issue');
    if (issue && PAIN_POINTS.some((p) => p.id === issue)) {
      setSelected((prev) => (prev.includes(issue) ? prev : [...prev, issue]));
      setStep(1);
    }
  }, [searchParams]);

  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const selectedPoints = useMemo(
    () => PAIN_POINTS.filter((p) => selected.includes(p.id)),
    [selected]
  );

  const estimate = useMemo(() => {
    if (selectedPoints.length === 0) return null;
    const maxTurnaround = Math.max(...selectedPoints.map((p) => p.turnaroundHours));
    const totalMin = selectedPoints.reduce((s, p) => s + p.costMin, 0);
    const totalMax = selectedPoints.reduce((s, p) => s + p.costMax, 0);
    let tier = 'Starter Ops';
    if (totalMax > 100000) tier = 'Enterprise / Fractional CTO';
    else if (totalMax > 40000) tier = 'Managed Growth';
    return {
      turnaround: maxTurnaround,
      costMin: totalMin,
      costMax: totalMax,
      tier,
    };
  }, [selectedPoints]);

  function togglePain(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function next() {
    if (step === 1 && selected.length === 0) {
      toast.error('Select at least one issue so we know what to fix.');
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function submit() {
    if (!email && !whatsapp) {
      toast.error('Add your email or WhatsApp so we can reach you.');
      return;
    }
    if (!estimate) return;
    setSubmitting(true);

    const painTitles = selectedPoints.map((p) => p.title);
    const payload = {
      source: 'diagnostic' as const,
      pain_points: painTitles,
      company_name: company,
      domain_url: domain,
      description,
      email,
      whatsapp,
      estimated_tier: estimate.tier,
      estimated_cost_min: estimate.costMin,
      estimated_cost_max: estimate.costMax,
      turnaround_hours: estimate.turnaround,
    };

    try {
      // 1. Insert into Supabase leads table first
      const { data: leadData, error: dbError } = await supabase
        .from('leads')
        .insert(payload)
        .select('id')
        .single();

      if (dbError) {
        console.error('[diagnostic] Supabase insert error:', dbError);
        throw new Error('Could not save your request to our database. Please try again.');
      }

      // 2. Dispatch to /api/leads for email notification (fire and forget)
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, skip_insert: true }),
      }).catch((apiErr) => {
        console.error('[diagnostic] /api/leads notification failed:', apiErr);
      });

      // 3. Only now show the success screen
      const waText = `Hello HostSuite, I need help with my website.

*Company:* ${company || '—'}
*Domain:* ${domain || '—'}
*Issues:*
${painTitles.map((t) => `• ${t}`).join('\n')}

*Description:* ${description || '—'}
*Estimated Tier:* ${estimate.tier}
*Est. Cost:* ${formatNairaRange(estimate.costMin, estimate.costMax)}
*Est. Turnaround:* ${formatTurnaround(estimate.turnaround)}

*Email:* ${email || '—'}
*WhatsApp:* ${whatsapp || '—'}`;

      window.open(waLink(waText), '_blank', 'noopener,noreferrer');
      setDone(true);
      toast.success('Your details are ready. Check WhatsApp to continue the conversation.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(1);
    setSelected([]);
    setCompany('');
    setDomain('');
    setDescription('');
    setEmail('');
    setWhatsapp('');
    setDone(false);
  }

  return (
    <section id="diagnostic" className="relative scroll-mt-20 overflow-hidden bg-[#20191D] py-24 text-white sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute -right-40 top-0 h-[560px] w-[560px] rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute -right-16 top-24 h-[320px] w-[320px] rounded-full border border-white/[0.06]" />
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:px-16 xl:px-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D6B08B]"><span className="h-px w-8 bg-[#D6B08B]" /> Start with what’s happening</p>
          <h2 className="mt-7 max-w-[520px] font-display text-[clamp(2.8rem,5vw,5.2rem)] font-semibold leading-[0.97] tracking-[-0.07em] text-white">
            Tell us what’s getting in the way.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/65 sm:text-base">
            Choose the issues you want help with. We’ll ask only for the details we need, then give you a clear starting point and a way to speak with our team.
          </p>
          <div className="mt-10 border-t border-white/20 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D6B08B]">A simpler way to get help</p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/55">No technical language. No pressure to move your hosting. Just a clear conversation about what your website needs.</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/20 pb-5">
            {[
              { n: 1, label: 'The issue' },
              { n: 2, label: 'Your website' },
              { n: 3, label: 'Your next step' },
            ].map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center border text-xs font-bold transition-colors ${step >= s.n ? 'border-[#D6B08B] bg-[#D6B08B] text-[#20191D]' : 'border-white/30 text-white/55'}`}>
                    {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                  </span>
                  <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline ${step >= s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                </div>
                {i < 2 && <div className="mx-3 h-px flex-1 bg-white/20" />}
              </div>
            ))}
          </div>

          <div className="overflow-hidden border border-[#E2D8CC] bg-[#F6F1E9] shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
            <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && !done && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8"
              >
                <h3 className="font-display text-xl font-semibold text-[#211B1D]">
                  What would you like us to take off your hands?
                </h3>
                <p className="mt-1 text-sm text-[#69615C]">
                  Select everything that applies. We will take it from there.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {PAIN_POINTS.map((p: PainPoint) => {
                    const Icon = painIconMap[p.icon] ?? Wrench;
                    const active = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePain(p.id)}
                        className={`group relative flex items-start gap-3 rounded-none border p-4 text-left transition-all ${
                          active
                            ? 'border-[#B48A68] bg-[#D6B08B]/5 ring-1 ring-primary/30'
                            : 'border-[#D8CFC4] bg-white hover:border-[#B48A68]/40 hover:bg-[#EEE8DF]/40'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-none transition-colors ${
                            active ? 'bg-[#D6B08B] text-[#6D4438]-foreground' : 'bg-[#EEE8DF] text-[#6D4438]'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold leading-snug text-[#211B1D]">
                            {p.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#69615C]">
                            {p.description}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-[#6D4438]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && !done && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8"
              >
                <h3 className="font-display text-xl font-semibold text-[#211B1D]">
                  A little context helps us come prepared.
                </h3>
                <p className="mt-1 text-sm text-[#69615C]">
                  Share what you can. You do not need to know the technical details.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diag-company">Company Name</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69615C]" />
                      <Input
                        id="diag-company"
                        placeholder="Acme Nigeria Ltd."
                        className="pl-9"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diag-domain">Domain URL</Label>
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69615C]" />
                      <Input
                        id="diag-domain"
                        placeholder="company.com.ng"
                        className="pl-9 font-mono-data"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="diag-desc">Describe what you need fixed or built</Label>
                  <Textarea
                    id="diag-desc"
                    rows={5}
                    placeholder="e.g. Our developer left and we cannot access cPanel. Emails from info@ourdomain.com are going to spam and we need 10 staff mailboxes set up..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="mt-4 rounded-none bg-[#EEE8DF] p-3">
                  <p className="text-xs font-medium text-[#69615C]">You selected:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedPoints.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-none bg-[#EAE3D9] px-2.5 py-1 text-xs font-medium text-[#6D4438]"
                      >
                        {p.short}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && !done && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8"
              >
                <h3 className="font-display text-xl font-semibold text-[#211B1D]">
                  A clear starting point
                </h3>
                <p className="mt-1 text-sm text-[#69615C]">
                  This is an initial guide based on what you selected. We will confirm the details with you.
                </p>

                {estimate && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-none border border-[#D8CFC4] bg-white p-4">
                      <Clock className="h-5 w-5 text-[#6D4438]" />
                      <p className="mt-2 text-xs text-[#69615C]">Est. Turnaround</p>
                      <p className="font-mono-data text-sm font-semibold text-[#211B1D]">
                        {formatTurnaround(estimate.turnaround)}
                      </p>
                    </div>
                    <div className="rounded-none border border-[#D8CFC4] bg-white p-4">
                      <BadgeDollarSign className="h-5 w-5 text-[#6D4438]" />
                      <p className="mt-2 text-xs text-[#69615C]">Est. Cost Range</p>
                      <p className="font-mono-data text-sm font-semibold text-[#211B1D]">
                        {formatNairaRange(estimate.costMin, estimate.costMax)}
                      </p>
                    </div>
                    <div className="rounded-none border border-[#B48A68]/30 bg-[#EAE3D9] p-4">
                      <Sparkles className="h-5 w-5 text-[#6D4438]" />
                      <p className="mt-2 text-xs text-[#69615C]">Recommended Tier</p>
                      <p className="font-display text-sm font-semibold text-[#6D4438]">
                        {estimate.tier}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diag-email">Corporate Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69615C]" />
                      <Input
                        id="diag-email"
                        type="email"
                        placeholder="you@company.com.ng"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diag-wa">WhatsApp Number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69615C]" />
                      <Input
                        id="diag-wa"
                        placeholder="234 803 000 0000"
                        className="pl-9"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-none bg-[#EEE8DF] p-3 text-xs text-[#6D4438]/90">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Submitting opens a WhatsApp chat with our engineers, pre-filled with your diagnostic details.
                </div>
              </motion.div>
            )}

            {/* DONE */}
            {done && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center p-10 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-[#211B1D]">
                  We’ll take it from here.
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#69615C]">
                  We have received your details and opened a WhatsApp conversation so we can understand the request and agree what happens next.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="bg-[#211A20] text-[#6D4438]-foreground hover:bg-[#211A20]/90">
                    <a
                      href={waLink('Hello HostSuite, I just submitted a diagnostic request and would like to continue.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" /> Open WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Submit another request
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer controls */}
          {!done && (
            <div className="flex items-center justify-between border-t border-[#DED5DF] bg-[#EEE8DF] px-6 py-4 sm:px-8">
              <Button
                variant="ghost"
                onClick={back}
                disabled={step === 1}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < 3 ? (
                <Button
                  onClick={next}
                  className="bg-[#D6B08B] text-[#6D4438]-foreground hover:bg-[#D6B08B]/90"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="bg-[#211A20] text-[#6D4438]-foreground hover:bg-[#211A20]/90"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Submit &amp; Continue on WhatsApp <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
