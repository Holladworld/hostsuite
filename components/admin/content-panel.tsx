'use client';

import { useState, useEffect } from 'react';
import {
  Settings2,
  Save,
  Loader2,
  Type,
  Phone,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useAdminSettings } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AdminContentPanel() {
  const { settings, loading, saveSetting } = useAdminSettings();

  const [hero, setHero] = useState({
    headline: '',
    subheadline: '',
    hotlineText: '',
    whatsappDisplay: '',
  });
  const [pricing, setPricing] = useState({
    starter_ops_monthly: 5000,
    starter_ops_annual: 50000,
    managed_growth_monthly: 12000,
    managed_growth_annual: 120000,
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (settings.hero) {
      setHero((prev) => ({
        ...prev,
        headline: settings.hero?.headline ?? prev.headline,
        subheadline: settings.hero?.subheadline ?? prev.subheadline,
        hotlineText: settings.hero?.hotlineText ?? prev.hotlineText,
        whatsappDisplay: settings.hero?.whatsappDisplay ?? prev.whatsappDisplay,
      }));
    }
    if (settings.pricing) {
      setPricing((prev) => ({
        ...prev,
        ...settings.pricing,
      }));
    }
  }, [settings]);

  async function handleSaveHero() {
    setSaving('hero');
    const ok = await saveSetting('hero', hero);
    if (ok) toast.success('Homepage hero content saved.');
    else toast.error('Failed to save hero content.');
    setSaving(null);
  }

  async function handleSavePricing() {
    setSaving('pricing');
    const ok = await saveSetting('pricing', pricing);
    if (ok) toast.success('Pricing configuration saved.');
    else toast.error('Failed to save pricing.');
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
        <Settings2 className="h-5 w-5 text-primary" /> Website Content &amp; Banner Editor
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Dynamically update live homepage text. Changes appear on the public site immediately.
      </p>

      {/* Hero Section */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Hero Section</h3>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="hero-headline">Hero Headline</Label>
            <Input
              id="hero-headline"
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              placeholder="Your Developer Disappeared. Your Server Is Down. We Fix Both."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="hero-subheadline">Hero Subheadline</Label>
            <Textarea
              id="hero-subheadline"
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              placeholder="HostSuite is your fractional CTO and web operations team…"
              className="mt-1.5 min-h-[80px]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hotline-text">Emergency Hotline Text</Label>
              <Input
                id="hotline-text"
                value={hero.hotlineText}
                onChange={(e) => setHero({ ...hero, hotlineText: e.target.value })}
                placeholder="Emergency Infrastructure Hotline"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp-display">WhatsApp Display Number</Label>
              <Input
                id="whatsapp-display"
                value={hero.whatsappDisplay}
                onChange={(e) => setHero({ ...hero, whatsappDisplay: e.target.value })}
                placeholder="+234 814 224 3764"
                className="mt-1.5"
              />
            </div>
          </div>
          <Button onClick={handleSaveHero} disabled={saving === 'hero'} className="gap-2">
            {saving === 'hero' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Hero Content
          </Button>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Pricing Configuration (NGN)</h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="starter-monthly">Starter Ops — Monthly</Label>
            <Input
              id="starter-monthly"
              type="number"
              value={pricing.starter_ops_monthly}
              onChange={(e) => setPricing({ ...pricing, starter_ops_monthly: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="starter-annual">Starter Ops — Annual</Label>
            <Input
              id="starter-annual"
              type="number"
              value={pricing.starter_ops_annual}
              onChange={(e) => setPricing({ ...pricing, starter_ops_annual: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="growth-monthly">Managed Growth — Monthly</Label>
            <Input
              id="growth-monthly"
              type="number"
              value={pricing.managed_growth_monthly}
              onChange={(e) => setPricing({ ...pricing, managed_growth_monthly: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="growth-annual">Managed Growth — Annual</Label>
            <Input
              id="growth-annual"
              type="number"
              value={pricing.managed_growth_annual}
              onChange={(e) => setPricing({ ...pricing, managed_growth_annual: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button onClick={handleSavePricing} disabled={saving === 'pricing'} className="mt-4 gap-2">
          {saving === 'pricing' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Pricing
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 p-4">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <p className="text-sm text-foreground/80">
          Changes save to the database and appear on the live site immediately after page refresh.
        </p>
      </div>
    </div>
  );
}
