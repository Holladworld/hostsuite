import './globals.css';
import type { Metadata } from 'next';
import { Instrument_Serif, Manrope, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

const editorial = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' });
const interfaceText = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope', display: 'swap' });
const technicalText = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ibm-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://hostsuite.app'),
  title: 'HostSuite — Digital infrastructure, without the headache.',
  description:
    'Domains, websites, hosting, business email, monitoring and technical help — managed simply for growing businesses.',
  keywords: [
    'managed hosting Nigeria',
    'business email',
    'website management',
    'web infrastructure',
    'technical support',
    'HostSuite',
  ],
  openGraph: {
    title: 'HostSuite — Digital infrastructure, without the headache.',
    description:
      'Build it. Launch it. Keep it running. Get help when something goes wrong.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${editorial.variable} ${interfaceText.variable} ${technicalText.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ classNames: { toast: 'font-body' } }}
        />
      </body>
    </html>
  );
}
