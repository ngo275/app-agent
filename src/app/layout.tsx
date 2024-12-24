import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { getServerSession } from 'next-auth';
import { Inter } from 'next/font/google';

import './globals.css';
import { Providers } from '@/components/providers';
import { getLocale } from 'next-intl/server';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
const inter = Inter({ subsets: ['latin'] });

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  metadataBase: new URL('https://app-agent.ai'),
  title: 'AppAgent | From ASO to Release, All Streamlined',
  description:
    'AppAgent automates ASO while simplifying every step from planning to release. Effortlessly generate multilingual release notes, track growth, and handle updates—all in one place. OSS alternative to AppTweak, App Radar, and Sensor Tower.',
  keywords: [
    'ASO',
    'ASO Agent',
    'AppAgent',
    'App Agent',
    'ASO AI',
    'App Store Optimization',
    'Mobile Marketing',
    'App Rankings',
    'Keyword Analysis',
    'App Visibility',
    'Organic Downloads',
    'App Growth',
    'Open Source',
    'OSS',
    'App Radar',
    'AppTweak',
    'Sensor Tower',
    'App Store Connect',
  ],
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      ja: '/ja',
    },
  },
  openGraph: {
    title: 'AppAgent | From ASO to Release, All Streamlined',
    description:
      'AppAgent automates ASO while simplifying every step from planning to release. Effortlessly generate multilingual release notes, track growth, and handle updates—all in one place. OSS alternative to AppTweak, App Radar, and Sensor Tower.',
    url: 'https://app-agent.ai',
    siteName: 'AppAgent',
    images: [
      {
        url: 'https://app-agent.ai/images/og.jpg',
        width: 1200,
        height: 630,
        alt: 'AppAgent',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppAgent | From ASO to Release, All Streamlined',
    description:
      'AppAgent automates ASO while simplifying every step from planning to release. Effortlessly generate multilingual release notes, track growth, and handle updates—all in one place. OSS alternative to AppTweak, App Radar, and Sensor Tower.',
    images: ['https://app-agent.ai/images/og.jpg'],
    site: '@ngo275',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers session={session}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
