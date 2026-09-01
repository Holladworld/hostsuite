import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';

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
    <html lang="en">
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
