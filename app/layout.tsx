import './globals.css';
import type { Metadata } from 'next';
import { Syne, DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

const display = Syne({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-syne', display: 'swap' });
const interfaceText = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans', display: 'swap' });
const technicalText = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-ibm-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://hostsuite.app'),
  title: 'HostSuite — Your website, looked after.',
  description: 'Website management, practical technical support and ongoing care for businesses that already have a website.',
  keywords: ['managed hosting Nigeria', 'business email', 'website management', 'web infrastructure', 'technical support', 'HostSuite'],
  openGraph: {
    title: 'HostSuite — Your website, looked after.',
    description: 'Already have a website? HostSuite helps you manage it, make changes and handle the technical work without the jargon.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${interfaceText.variable} ${technicalText.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ classNames: { toast: 'font-body' } }} />
      </body>
    </html>
  );
}
