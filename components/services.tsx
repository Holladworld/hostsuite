import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const help = [
  {
    number: '01',
    title: 'Keep my existing website running',
    description: 'Routine care, updates, backups, security and practical changes for a website you already own.',
    detail: 'ONGOING WEBSITE CARE',
    href: '/services#managed-servers',
  },
  {
    number: '02',
    title: 'My developer is unavailable',
    description: 'Recover access to your website, hosting or domain, understand what you have, and decide what happens next.',
    detail: 'ACCESS & HANDOVER',
    href: '/?issue=developer-ghosted#diagnostic',
  },
  {
    number: '03',
    title: 'My business email is not working',
    description: 'Investigate missing, bouncing or spam-bound messages and help restore dependable business email.',
    detail: 'EMAIL & DELIVERABILITY',
    href: '/services#email-deliverability',
  },
  {
    number: '04',
    title: 'I need someone to make website changes',
    description: 'Get help with content updates, small improvements and the technical jobs you do not want to manage.',
    detail: 'WEBSITE CHANGES',
    href: '/#diagnostic',
  },
  {
    number: '05',
    title: 'My website was built with AI',
    description: 'Keep the site you created, get help managing it, and improve it when your business is ready.',
    detail: 'AI-BUILT WEBSITE SUPPORT',
    href: '/#ai-websites',
  },
  {
    number: '06',
    title: 'I may need a new host or website',
    description: 'When it is time to renew, move or start again, we can help you choose the next step without forcing a switch.',
    detail: 'HOSTING, MIGRATION & NEW BUILDS',
    href: '/services#zero-downtime-migration',
  },
];

export function Services() {
  return (
    <>
      <section id="services" className="scroll-mt-20 bg-[#F5F1EA] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20 lg:px-12">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[#80688B]">Start with what is happening</p>
            <h2 className="mt-5 max-w-[10ch] font-display text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-[#24132F] sm:text-5xl">
              You have a website. We help you look after it.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#665D69]">
              You do not need to know how websites work to get help with one. Tell us what is happening in your own words and we will help you find a sensible next step.
            </p>
            <Link href="/#diagnostic" className="mt-8 inline-flex items-center gap-2 border-b border-[#A996B0] pb-2 text-sm font-semibold text-[#4A1F6B] hover:border-[#4A1F6B]">
              Tell us what you need <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t border-[#D9D0DD]">
            {help.map((item) => (
              <Link key={item.number} href={item.href} className="group grid gap-3 border-b border-[#D9D0DD] py-6 transition-colors hover:bg-white/55 sm:grid-cols-[3rem_1fr_auto] sm:gap-5 sm:px-3">
                <span className="pt-1 font-mono-data text-xs text-[#8B7793]">{item.number}</span>
                <span>
                  <span className="block font-display text-2xl font-normal leading-tight text-[#24132F] sm:text-[1.8rem]">{item.title}</span>
                  <span className="mt-2 block max-w-2xl text-sm leading-6 text-[#6C6470]">{item.description}</span>
                  <span className="mt-3 block font-mono-data text-[10px] uppercase tracking-[0.1em] text-[#8B7793]">{item.detail}</span>
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 text-[#8B7793] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#4A1F6B]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono-data text-[11px] uppercase tracking-[0.18em] text-[#80688B]">A relationship that works your way</p>
              <h2 className="mt-5 max-w-[11ch] font-display text-4xl font-normal leading-[1.02] tracking-[-0.025em] text-[#24132F] sm:text-5xl">You stay in control. We take care of the technical work.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#665D69] lg:justify-self-end">
              Some people want to do things themselves. Others want a team they can call. You can choose how much help you need, and that can change over time.
            </p>
          </div>
          <div className="mt-12 grid border-y border-[#D9D0DD] md:grid-cols-3">
            <article className="py-7 md:pr-8">
              <p className="font-mono-data text-xs text-[#8B7793]">01 / GUIDED</p>
              <h3 className="mt-4 font-display text-2xl text-[#24132F]">I want to do it myself.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Use the customer portal and straightforward guidance to handle the tasks you are comfortable with.</p>
            </article>
            <article className="border-t border-[#D9D0DD] py-7 md:border-l md:border-t-0 md:px-8">
              <p className="font-mono-data text-xs text-[#8B7793]">02 / MANAGED</p>
              <h3 className="mt-4 font-display text-2xl text-[#24132F]">Please handle it for me.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Let HostSuite take care of the agreed website and technical responsibilities while you focus on your business.</p>
            </article>
            <article className="border-t border-[#D9D0DD] py-7 md:border-l md:border-t-0 md:pl-8">
              <p className="font-mono-data text-xs text-[#8B7793]">03 / ON DEMAND</p>
              <h3 className="mt-4 font-display text-2xl text-[#24132F]">I just need help right now.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Bring us a specific issue or request. You do not have to sign up for full management to ask for help.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-websites" className="scroll-mt-20 bg-[#21132F] text-white">
        <div className="grid max-w-[1440px] lg:mx-auto lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 xl:px-20">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#CBB5D8]">When you are ready for something new</p>
            <h2 className="mt-5 max-w-[11ch] font-display text-4xl font-normal leading-[0.98] sm:text-5xl lg:text-6xl">Your next website does not have to start from scratch.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Keep the website you already have, or explore an AI-assisted first draft when it is time for a change. You can work on it yourself or ask our team to help shape the next version.
            </p>
            <Link href="/portal/ai-builder" className="mt-8 inline-flex w-fit items-center gap-2 border-b border-white/50 pb-2 text-sm font-semibold text-white hover:border-white">
              Explore AI website creation <ArrowUpRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 max-w-lg text-xs leading-6 text-white/45">A new website is an option, not a requirement for getting help with the one you already own.</p>
          </div>
          <div className="relative min-h-[340px] overflow-hidden sm:min-h-[440px]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=85')" }} role="img" aria-label="Creative team collaborating in a bright studio" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#21132F]/45 via-transparent to-transparent" />
          </div>
        </div>
      </section>
    </>
  );
}
