'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Loader2, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SearchResult = { domain: string; available: boolean };
type SearchError = { error?: string; code?: string };

export function DomainSearch() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = domain.trim().toLowerCase().replace(/^https?:\\/\\//, '').replace(/^www\\./, '').replace(/\\/$/, '');
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(normalized)) {
      setResult(null);
      setError('Enter a domain name such as yourbusiness.com.');
      return;
    }
    setChecking(true);
    setResult(null);
    setError('');
    try {
      const response = await fetch(`/api/domains/search?domain=${encodeURIComponent(normalized)}`, { cache: 'no-store' });
      const data = await response.json() as SearchResult & SearchError;
      if (!response.ok) {
        setError(data.code === 'NOT_CONFIGURED'
          ? 'Live domain search is not connected in this environment yet. Please contact HostSuite and we can check it for you.'
          : data.error || 'We could not check that domain right now. Please try again.');
      } else {
        setResult({ domain: data.domain, available: data.available });
      }
    } catch {
      setError('We could not reach the domain search service. Please try again shortly.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl shadow-black/10 sm:flex-row">
        <label htmlFor="domain-search" className="sr-only">Domain name to search</label>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <Search className="h-5 w-5 shrink-0 text-[#6D557C]" />
          <Input id="domain-search" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="yourbusiness.com" autoCapitalize="none" autoCorrect="off" className="h-12 border-0 px-0 text-base text-[#281A32] shadow-none focus-visible:ring-0" />
        </div>
        <Button type="submit" disabled={checking} className="h-12 rounded-xl bg-[#542477] px-6 text-white hover:bg-[#43205F]">
          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Check availability
        </Button>
      </form>
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">{error}</p>}
      {result && (
        <div aria-live="polite" className="mt-4 flex flex-col gap-4 rounded-2xl border border-white/25 bg-white p-5 text-[#281A32] shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${result.available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{result.domain}</p>
              <p className="mt-1 text-sm text-[#6B6071]">{result.available ? 'This domain is reported as available.' : 'This domain is not currently available.'}</p>
            </div>
          </div>
          {result.available && <Button asChild className="shrink-0 bg-[#542477] text-white hover:bg-[#43205F]"><Link href="/portal?mode=signup">Create account to continue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-white/70">Availability can change until registration is completed. Searching does not reserve a domain.</p>
    </div>
  );
}
