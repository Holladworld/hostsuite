import './globals.css';
import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hostsuite.app'),
  title: 'HostSuite — Managed Web Infrastructure & Developer Operations',
  description:
    'HostSuite is your fractional CTO and web operations team. We manage hosting, fix email deliverability, recover lost access, and build custom backend systems for businesses across Nigeria and globally.',
  keywords: [
    'managed hosting Nigeria',
    'web infrastructure',
    'cPanel recovery',
    'email deliverability',
    'fractional CTO',
    'Vobels Limited HostSuite',
  ],
  openGraph: {
    title: 'HostSuite — Managed Web Infrastructure & Developer Operations',
    description:
      'We do not just sell hosting. We manage your entire web infrastructure and fix your technical bottlenecks.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${jetbrains.variable}`}>
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
