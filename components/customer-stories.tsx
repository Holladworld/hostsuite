'use client';

import { ArrowUpRight, Globe2, Star } from 'lucide-react';

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
      className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[#E9D8F3] underline decoration-[#9F7AB5] underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#291B32]"
      aria-label={`Visit ${website} (opens in a new tab)`}
    >
      <Globe2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{website}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0" />
    </a>
  );
}

function CustomerMark({ name }: { name: string }) {
  const initials = name
    .split(/\\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E7D9ED] bg-[#F4EDF7] text-xs font-extrabold tracking-wide text-[#5B2B7A]"
    >
      {initials}
    </span>
  );
}

export function CustomerStories() {
  return (
    <section
      aria-labelledby="customer-stories-title"
      className="relative overflow-hidden bg-[#F5F1F6] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
    >
      <div className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full border border-[#E6DCEB] sm:-right-16" />
      <div className="pointer-events-none absolute -right-12 top-24 h-56 w-56 rounded-full border border-[#E6DCEB]" />

      <div className="relative mx-auto max-w-[1320px]">
        <div className="grid gap-8 border-b border-[#DED4E3] pb-9 sm:pb-12 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCCCE5] bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#5B2B7A] shadow-sm sm:text-[11px]">
              <span className="flex items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} className="h-3 w-3 fill-[#A87936] text-[#A87936]" />
                ))}
              </span>
              Customer experiences
            </div>
            <h2
              id="customer-stories-title"
              className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#261832] sm:text-5xl lg:text-6xl"
            >
              The people behind the websites. <span className="text-[#795293]">The experience behind the work.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#62566A] lg:justify-self-end lg:pb-1 lg:text-base">
            Website support is personal. These customer stories show what it looks like when there is a real team to turn to.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:mt-10 lg:grid-cols-12">
          {stories.map((story) => (
            <article
              key={story.number}
              className={`group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[#E5DCE9] bg-white p-6 shadow-[0_12px_36px_rgba(40,23,50,0.055)] transition-transform duration-300 hover:-translate-y-1 sm:p-8 ${story.featured ? 'lg:col-span-7 lg:min-h-[430px] lg:p-10' : 'lg:col-span-5'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#987FA5]">
                    Customer story&nbsp; / &nbsp;{story.number}
                  </span>
                  <span aria-hidden="true" className="font-display text-5xl leading-none text-[#E9DFED]">
                    “
                  </span>
                </div>
                <h3
                  className={`mt-3 max-w-2xl font-display font-semibold leading-[1.12] tracking-[-0.04em] text-[#2B1A37] ${story.featured ? 'text-2xl sm:text-3xl lg:text-[2.65rem]' : 'text-xl sm:text-2xl'}`}
                >
                  {story.title}
                </h3>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#665B6D] sm:text-[15px] sm:leading-8">
                  {story.story}
                </p>
              </div>

              <div className="mt-8 border-t border-[#EEE8F1] pt-5">
                <div className="flex min-w-0 items-center gap-3">
                  <CustomerMark name={story.name} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#2B1A37]">{story.name}</p>
                    <p className="mt-1 text-xs leading-5 text-[#82778A]">{story.role}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-[#2B1C34] px-4 py-3">
                  <CompanyLink website={story.website} href={story.href} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 max-w-3xl text-[11px] leading-5 text-[#817487]">
          These are customer experience summaries, not scored ratings or verbatim quotations. Company websites are linked so visitors can learn more about each business.
        </p>
      </div>
    </section>
  );
}
