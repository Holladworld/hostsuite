import './globals.css';
import type { Metadata } from 'next';
import { Instrument_Serif, Manrope, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

const editorial = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' });
const interfaceText = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope', display: 'swap' });
const technicalText = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ibm-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://hostsuite.app'),
  title: 'HostSuite — Website management, without the technical weight.',
  description: 'Website recovery, business email fixes and ongoing website care for businesses that already have a website. Keep what works. Get dependable support.',
  keywords: ['website management Nigeria', 'website recovery', 'business email support', 'website maintenance', 'HostSuite'],
  openGraph: {
    title: 'HostSuite — Website management, without the technical weight.',
    description: 'Keep the website you already have. Get practical help with access, email, maintenance and ongoing care.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${editorial.variable} ${interfaceText.variable} ${technicalText.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ classNames: { toast: 'font-body' } }} />
      </body>
    </html>
  );
}
