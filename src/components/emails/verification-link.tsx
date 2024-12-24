import React from 'react';

import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { createTranslator } from 'next-intl';

const VerificationLinkEmail = async ({
  url = `${NEXT_PUBLIC_BASE_URL}`,
  locale,
}: {
  url: string;
  locale: string;
}) => {
  const t = createTranslator({
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    namespace: 'emails.verification-link',
  });
  const tCommon = createTranslator({
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    namespace: 'emails.common',
  });
  return (
    <Html>
      <Head />
      <Preview>{t('title')}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              <span className="font-bold tracking-tighter">
                {tCommon('title')}
              </span>
            </Text>
            <Text className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
              {t('preview')}
            </Text>

            <Text className="text-sm leading-6 text-black">
              {t('description')}
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={url}
                style={{ padding: '12px 20px' }}
              >
                {t('sign-in')}
              </Button>
            </Section>
            <Text className="text-sm leading-6 text-black">
              {t('or-copy-and-paste-this-url-into-your-browser')}
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url.replace(/^https?:\/\//, '')}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationLinkEmail;
