import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { I18nProvider } from '@/components/I18nProvider';
import { getServerMessages } from '@/lib/i18n-server';
import { siteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL('https://trialbeacon.example.com'),
  title: {
    default: 'TrialBeacon — Trusted updates from official sources',
    template: '%s · TrialBeacon',
  },
  description:
    'A neutral index of publicly listed clinical trials, guideline indexes and regulatory notices from official sources in the United States, Europe and China. No recommendations. No medical advice.',
  keywords: [
    'clinical trials',
    'official sources',
    'ClinicalTrials.gov',
    'EMA',
    'CTIS',
    'CDE',
    'NMPA',
    'cancer information index',
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'TrialBeacon — Trusted updates from official sources',
    description:
      'A neutral index of publicly listed clinical trials, guidelines and regulatory notices from the US, Europe and China.',
    type: 'website',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'TrialBeacon' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.svg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F172A',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, messages } = await getServerMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        <I18nProvider locale={locale} messages={messages}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
