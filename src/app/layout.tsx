import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { getServerSession } from 'next-auth';

import './globals.css';
import { Providers } from '@/components/providers';
import { getLocale } from 'next-intl/server';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
const appFont = localFont({ src: './fonts/GeistVF.woff' });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ),
  title: 'AppAgent | Local ASO and release tools',
  description:
    'Open-source app store optimization and release tooling for your own local environment.',
  robots: { index: false, follow: false },
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
      <body className={`${appFont.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers session={session}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
