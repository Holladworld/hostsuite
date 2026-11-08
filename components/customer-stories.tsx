'use client';

import { ArrowUpRight, Globe2 } from 'lucide-react';

const stories = [
  {
    number: '01',
    name: 'Sanjo Temitope',
    role: 'CEO, OTP Global Limited',
    website: 'otpgloballimited.com',
    href: 'https://otpgloballimited.com',
    title: 'A real person to call, without another task to manage.',
    story:
      'When OTP Global needed an online presence in 2017, Vobels Limited stepped in. Knowing there was a real person to speak with made the difference. Today, Sanjo can reach the team on WhatsApp whenever the website needs attention, without carrying the technical work himself.',
    featured: true,
  },
  {
    number: '02',
    name: 'Folake Oloyede',
    role: 'Founder, Beyond Books Accounting Solutions',
    website: 'beyondbooksaccounting.ca',
    href: 'https://beyondbooksaccounting.ca',
    title: 'A careful move from Wix, without losing what she had built.',
    story:
      'After being referred to Vobels, Folake needed to move her existing website away from Wix without losing the work already invested in it. The migration was handled without disrupting the website, and she appreciated how smoothly and quickly the project was completed.',
  },
  {
    number: '03',
    name: 'Jumoke',
    role: 'WAPAC Export',
    website: 'wapac.com.ng',
    href: 'https://wapac.com.ng',
    title: 'From a frustrating AI draft to a properly hosted website.',
    story:
      'Jumoke had built a website with AI, but it was not delivering what she wanted and the project had been left untouched for weeks. After discussing her requirements, the site was moved from the AI builder to proper hosting in under a week, with domain management included within her budget.',
  },
];

function CompanyLink({ website, href }: { website: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#5B2B7A] underline decoration-[#CDB7DC] underline-offset-4 transition-colors hover:text-[#321747] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5BB0] focus-visible:ring-offset-2"
      aria-label={`Visit ${website} (opens in a new tab)`}
    >
      <Globe2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{website}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0" />
    </a>
  );
}

export function CustomerStories() {
  return (
    <section aria-labelledby="customer-stories-title" className="bg-[#FBF9FC] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#795293] sm:text-xs">CUSTOMER EXPERIENCES</p>
            <h2 id="customer-stories-title" className="mt-3 max-w-xl font-display text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#261832] sm:text-4xl lg:text-5xl">
              Real businesses. Real people behind the websites.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#6F6477] sm:text-right">
            Good website support should make running a business easier, not give you another thing to worry about.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          {stories.map((story) => (
            <article
              key={story.number}
              className={`flex h-full flex-col justify-between rounded-2xl border border-[#EAE2EF] bg-white p-6 shadow-[0_8px_30px_rgba(48,25,62,0.035)] sm:p-7 ${story.featured ? 'lg:col-span-7 lg:p-9' : 'lg:col-span-5'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#9B83AA]">STORY / {story.number}</span>
                  <span className="rounded-full bg-[#F4EEF7] px-3 py-1 text-[10px] font-semibold text-[#684580]">Customer story</span>
                </div>
                <h3 className={`mt-7 max-w-2xl font-display font-semibold leading-[1.12] tracking-[-0.035em] text-[#2B1A37] ${story.featured ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl sm:text-2xl'}`}>
                  {story.title}
                </h3>
                <p className="mt-5 text-sm leading-7 text-[#665B6D] sm:text-[15px] sm:leading-8">
                  {story.story}
                </p>
              </div>

              <div className="mt-8 border-t border-[#EEE8F1] pt-5">
                <p className="font-semibold text-[#2B1A37]">{story.name}</p>
                <p className="mt-1 text-xs text-[#82778A]">{story.role}</p>
                <div className="mt-3">
                  <CompanyLink website={story.website} href={story.href} />
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-[11px] leading-5 text-[#887D90]">
          Shared customer experiences, presented as written stories. Company websites are linked so visitors can learn more about each business.
        </p>
      </div>
    </section>
  );
}
