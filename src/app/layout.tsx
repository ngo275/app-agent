import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { getServerSession } from 'next-auth';
import { Inter } from 'next/font/google';

import './globals.css';
import { Providers } from '@/components/providers';
import { getLocale } from 'next-intl/server';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { WHITE_LABEL_CONFIG } from '@/lib/config';
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
  metadataBase: new URL(`https://${WHITE_LABEL_CONFIG.domain}`),
  title: `${WHITE_LABEL_CONFIG.appName} | ${WHITE_LABEL_CONFIG.tagline}`,
  description: WHITE_LABEL_CONFIG.description,
  keywords: [
    'ASO',
    'ASO Agent',
    WHITE_LABEL_CONFIG.appName,
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
    title: `${WHITE_LABEL_CONFIG.appName} | ${WHITE_LABEL_CONFIG.tagline}`,
    description: WHITE_LABEL_CONFIG.description,
    url: `https://${WHITE_LABEL_CONFIG.domain}`,
    siteName: WHITE_LABEL_CONFIG.appName,
    images: [
      {
        url: `https://${WHITE_LABEL_CONFIG.domain}/images/og.jpg`,
        width: 1200,
        height: 630,
        alt: WHITE_LABEL_CONFIG.appName,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${WHITE_LABEL_CONFIG.appName} | ${WHITE_LABEL_CONFIG.tagline}`,
    description: WHITE_LABEL_CONFIG.description,
    images: [`https://${WHITE_LABEL_CONFIG.domain}/images/og.jpg`],
    site: WHITE_LABEL_CONFIG.twitterHandle,
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
