import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const paths = [
  {
    number: '01',
    title: 'Do it yourself',
    text: 'Create an account and start bringing your digital services into one place.',
    action: 'Create your account',
    href: '/portal?mode=signup',
  },
  {
    number: '02',
    title: 'Let HostSuite handle it',
    text: 'Choose the setup, management or technical support your business needs.',
    action: 'Explore managed services',
    href: '/services',
  },
  {
    number: '03',
    title: 'Get help',
    text: 'Explain what is wrong. You do not need to know the technical name for it.',
    action: 'Start a diagnosis',
    href: '/#diagnostic',
  },
];

export function PromoBanner() {
  return (
    <section className="border-y border-[#E5DFE8] bg-white">
      <div className="mx-auto grid max-w-7xl md:grid-cols-3">
        {paths.map((path, index) => (
          <div
            key={path.number}
            className={`px-5 py-8 sm:px-8 sm:py-9 lg:px-10 ${index > 0 ? 'border-t border-[#E5DFE8] md:border-l md:border-t-0' : ''}`}
          >
            <p className="font-mono-data text-[11px] tracking-[0.16em] text-[#846D8E]">{path.number} <span className="text-[#C7BACB]">/ 03</span></p>
            <h2 className="mt-4 font-display text-2xl font-normal text-[#24132F] sm:text-[1.8rem]">{path.title}</h2>
            <p className="mt-2 min-h-[3rem] max-w-sm text-sm leading-6 text-[#6C6470]">{path.text}</p>
            <Link href={path.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#4A1F6B] underline decoration-[#C7BACB] underline-offset-4 transition hover:decoration-[#4A1F6B]">
              {path.action} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
