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
      toast.success('A good first step.. Check WhatsApp to continue the conversation.');
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
    <section id="diagnostic" className="relative scroll-mt-20 bg-[#21132F] py-20 text-white lg:py-24">
      
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#CBB5D8]">
            <Sparkles className="h-3.5 w-3.5" />
            A considered first step
          </span>
          <h2 className="mt-5 max-w-[12ch] font-display text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl">
            Tell us what your website needs.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            Choose what is happening. We will help you understand the next step, the likely effort and how to get it handled. No technical vocabulary required.
          </p>
        </div>

        {/* Stepper */}
        <div className="mt-9 flex max-w-lg items-center justify-between">
          {[
            { n: 1, label: 'What is happening' },
            { n: 2, label: 'Your website' },
            { n: 3, label: 'Next step' },
          ].map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    step >= s.n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {step > s.n ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    step >= s.n ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className="mx-2 mb-5 h-0.5 flex-1 rounded-none bg-border">
                  <div
                    className="h-full rounded-none bg-primary transition-all duration-500"
                    style={{ width: step > s.n ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="mt-8 overflow-hidden border border-[#DED5DF] bg-[#F8F5EF] shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
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
                <h3 className="font-display text-xl font-semibold text-foreground">
                  What would you like us to take off your hands?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
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
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-none transition-colors ${
                            active ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold leading-snug text-foreground">
                            {p.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {p.description}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
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
                <h3 className="font-display text-xl font-semibold text-foreground">
                  A little context helps us come prepared.
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share what you can. You do not need to know the technical details.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diag-company">Company Name</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                <div className="mt-4 rounded-none bg-[#F0EBE4] p-3">
                  <p className="text-xs font-medium text-muted-foreground">You selected:</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedPoints.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-none bg-[#E9E0EA] px-2.5 py-1 text-xs font-medium text-primary"
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
                <h3 className="font-display text-xl font-semibold text-foreground">
                  A clear starting point
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is an initial guide based on what you selected. We will confirm the details with you.
                </p>

                {estimate && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <Clock className="h-5 w-5 text-secondary" />
                      <p className="mt-2 text-xs text-muted-foreground">Est. Turnaround</p>
                      <p className="font-mono-data text-sm font-semibold text-foreground">
                        {formatTurnaround(estimate.turnaround)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <BadgeDollarSign className="h-5 w-5 text-secondary" />
                      <p className="mt-2 text-xs text-muted-foreground">Est. Cost Range</p>
                      <p className="font-mono-data text-sm font-semibold text-foreground">
                        {formatNairaRange(estimate.costMin, estimate.costMax)}
                      </p>
                    </div>
                    <div className="rounded-none border border-primary/30 bg-[#F0EAF2] p-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <p className="mt-2 text-xs text-muted-foreground">Recommended Tier</p>
                      <p className="font-display text-sm font-semibold text-primary">
                        {estimate.tier}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="diag-email">Corporate Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                <div className="mt-4 flex items-start gap-2 rounded-none bg-[#EEE7F0] p-3 text-xs text-secondary/90">
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
                <h3 className="mt-4 font-display text-2xl font-bold text-foreground">
                  Your request is in
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  We have received your details and opened a WhatsApp conversation so we can understand the request and agree what happens next.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
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
            <div className="flex items-center justify-between border-t border-[#DED5DF] bg-[#F0EBE4] px-6 py-4 sm:px-8">
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
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
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
    </section>
  );
}
