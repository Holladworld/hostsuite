import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const help = [
  {
    number: '01',
    title: 'The website is there. The person who built it is not.',
    description: 'Regain access, understand what you own and get a dependable team to take it forward.',
    detail: 'ACCESS & HANDOVER',
    href: '/?issue=developer-ghosted#diagnostic',
  },
  {
    number: '02',
    title: 'Your business email is letting you down.',
    description: 'Find out why messages bounce, disappear or land in spam—and put business communication back on track.',
    detail: 'EMAIL & DELIVERABILITY',
    href: '/services#email-deliverability',
  },
  {
    number: '03',
    title: 'Small website jobs keep becoming big distractions.',
    description: 'Content changes, updates, backups, security and the practical work that keeps a site dependable.',
    detail: 'ONGOING WEBSITE CARE',
    href: '/services#managed-servers',
  },
  {
    number: '04',
    title: 'You built it with AI. Now you need someone to look after it.',
    description: 'Keep the site you created. Get help with maintenance, improvements and the technical details behind it.',
    detail: 'AI-BUILT WEBSITE SUPPORT',
    href: '/#ai-websites',
  },
  {
    number: '05',
    title: 'It may be time for a better setup.',
    description: 'When your hosting expires or a move genuinely makes sense, we can plan it without disrupting your business.',
    detail: 'HOSTING, MIGRATION & NEW BUILDS',
    href: '/services#zero-downtime-migration',
  },
];

export function Services() {
  return (
    <>
      <section id="services" className="scroll-mt-20 bg-[#F5F1EA] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:gap-20 lg:px-12">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#80688B]">The things that get in the way</p>
            <h2 className="mt-5 max-w-[10ch] font-display text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-[#24132F] sm:text-6xl">
              You built the business. We will mind the website.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#665D69]">
              A website should support the work you do—not become another job on your list. Tell us what is happening. We will help you decide what needs attention and what can wait.
            </p>
            <Link href="/#diagnostic" className="mt-8 inline-flex items-center gap-2 border-b border-[#A996B0] pb-2 text-sm font-semibold text-[#4A1F6B] hover:border-[#4A1F6B]">
              Find the right kind of help <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="mt-10 hidden overflow-hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85"
                alt="Quiet, refined architectural workspace"
                className="h-[260px] w-full object-cover"
                loading="lazy"
              />
              <p className="mt-2 font-mono-data text-[9px] uppercase tracking-[0.15em] text-[#8B7793]">Less time managing. More time moving forward.</p>
            </div>
          </div>

          <div className="border-t border-[#D9D0DD]">
            {help.map((item) => (
              <Link key={item.number} href={item.href} className="group grid gap-3 border-b border-[#D9D0DD] py-7 transition-colors hover:bg-white/55 sm:grid-cols-[3rem_1fr_auto] sm:gap-5 sm:px-3">
                <span className="pt-1 font-mono-data text-xs text-[#8B7793]">{item.number}</span>
                <span>
                  <span className="block max-w-2xl font-display text-[1.7rem] font-normal leading-[1.08] text-[#24132F] sm:text-[2rem]">{item.title}</span>
                  <span className="mt-3 block max-w-2xl text-sm leading-6 text-[#6C6470]">{item.description}</span>
                  <span className="mt-3 block font-mono-data text-[9px] uppercase tracking-[0.14em] text-[#8B7793]">{item.detail}</span>
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 text-[#8B7793] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#4A1F6B]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#EAE3E9] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#80688B]">Support, on your terms</p>
              <h2 className="mt-5 max-w-[11ch] font-display text-5xl font-normal leading-[0.98] tracking-[-0.03em] text-[#24132F] sm:text-6xl">You choose how much we take off your hands.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#665D69] lg:justify-self-end">
              Some people want the tools and guidance to do it themselves. Others want a team to take responsibility. Start where you are; change the arrangement as your needs change.
            </p>
          </div>
          <div className="mt-12 grid border-y border-[#CFC3D2] md:grid-cols-3">
            <article className="py-7 md:pr-8">
              <p className="font-mono-data text-[10px] text-[#8B7793]">01 / GUIDED</p>
              <h3 className="mt-4 font-display text-3xl text-[#24132F]">Show me how.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Use clear guidance and the customer portal to handle the jobs you are comfortable owning.</p>
            </article>
            <article className="border-t border-[#CFC3D2] py-7 md:border-l md:border-t-0 md:px-8">
              <p className="font-mono-data text-[10px] text-[#8B7793]">02 / MANAGED</p>
              <h3 className="mt-4 font-display text-3xl text-[#24132F]">Please handle it.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Let HostSuite look after the agreed website and technical responsibilities while you focus on the business.</p>
            </article>
            <article className="border-t border-[#CFC3D2] py-7 md:border-l md:border-t-0 md:pl-8">
              <p className="font-mono-data text-[10px] text-[#8B7793]">03 / ON DEMAND</p>
              <h3 className="mt-4 font-display text-3xl text-[#24132F]">Just fix this.</h3>
              <p className="mt-3 text-sm leading-6 text-[#6C6470]">Bring us one issue or one job. You do not need a full management plan to get expert help.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-websites" className="scroll-mt-20 bg-[#21132F] text-white">
        <div className="grid max-w-[1600px] lg:mx-auto lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 xl:px-20">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#CBB5D8]">Made it with AI? Keep going.</p>
            <h2 className="mt-5 max-w-[11ch] font-display text-5xl font-normal leading-[0.96] sm:text-6xl">Creating the website was only the beginning.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Keep the website you made. Bring in HostSuite when you need updates, maintenance or a steady hand with the technical side. And when you are ready for a new direction, explore an AI-assisted rebuild with support available.
            </p>
            <Link href="/portal/ai-builder" className="mt-8 inline-flex w-fit items-center gap-2 border-b border-white/50 pb-2 text-sm font-semibold text-white hover:border-white">
              Explore AI website creation <ArrowUpRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 max-w-lg text-xs leading-6 text-white/45">A new website is an option—not the price of getting better support.</p>
          </div>
          <div className="relative min-h-[340px] overflow-hidden sm:min-h-[440px]">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=85"
              alt="Creative team working together in a bright studio"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#21132F]/45 via-transparent to-transparent" />
          </div>
        </div>
      </section>
    </>
  );
}
