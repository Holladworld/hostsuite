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

const starColors = [
  'text-[#F5B82E]',
  'text-[#F59E0B]',
  'text-[#E9A23B]',
  'text-[#D98A35]',
  'text-[#C77D36]',
];

function StarAccent({ large = false }: { large?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {starColors.map((color, index) => (
        <Star
          key={index}
          className={`${large ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-4 w-4'} fill-current ${color}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

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
    .split(/\s+/)
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
      className="relative overflow-hidden bg-[#F3EDF6] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full border border-[#E2D4E8] sm:-right-16" />
      <div className="pointer-events-none absolute -right-12 top-24 h-56 w-56 rounded-full border border-[#E2D4E8]" />

      <div className="relative mx-auto max-w-[1320px]">
        <div className="grid gap-7 border-b border-[#DCCFE2] pb-10 sm:pb-12 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#DCCCE5] bg-white px-4 py-2.5 shadow-sm">
              <StarAccent large />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#5B2B7A] sm:text-xs">
                Customer reviews
              </span>
            </div>
            <h2
              id="customer-stories-title"
              className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.96] tracking-[-0.06em] text-[#261832] sm:text-6xl lg:text-[4.5rem]"
            >
              Good work.
              <span className="block text-[#795293]">Real relationships.</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#62566A] lg:justify-self-end lg:pb-1 lg:text-lg lg:leading-8">
            Website support is personal. Here are a few experiences from people who have worked with our team.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:mt-11 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.number}
              className="group flex min-w-0 flex-col justify-between rounded-[1.4rem] border border-[#E2D7E8] bg-white p-6 shadow-[0_14px_38px_rgba(40,23,50,0.07)] transition-transform duration-300 hover:-translate-y-1 sm:p-7 lg:min-h-[430px] lg:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#987FA5]">
                    Customer experience
                  </span>
                  <span className="font-display text-3xl leading-none text-[#E9DFED]">
                    {story.number}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold leading-[1.08] tracking-[-0.04em] text-[#2B1A37] sm:text-[1.7rem]">
                  {story.title}
                </h3>
                <p className="mt-5 text-[15px] leading-7 text-[#665B6D]">
                  {story.story}
                </p>
              </div>

              <div className="mt-8 border-t border-[#EEE8F1] pt-5">
                <div className="flex min-w-0 items-center gap-3">
                  <CustomerMark name={story.name} />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#2B1A37]">{story.name}</p>
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

        <p className="mt-6 max-w-3xl text-[11px] leading-5 text-[#817487]">
          These are summaries of customer experiences, not verbatim quotations or verified star scores. The stars are a visual section accent, not individual customer ratings.
        </p>
      </div>
    </section>
  );
}
