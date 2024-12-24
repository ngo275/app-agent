import React from 'react';

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { CALL_LINK, GITHUB_LINK, X_LINK } from '@/lib/constants';
import { createTranslator } from 'next-intl';

interface WelcomeEmailProps {
  locale: string;
  name: string | null | undefined;
}

const WelcomeEmail = async ({ locale, name }: WelcomeEmailProps) => {
  const t = createTranslator({
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    namespace: 'emails.welcome',
  });
  const tCommon = createTranslator({
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    namespace: 'emails.common',
  });
  const previewText = t('title');

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
            <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
              {t('title')}
            </Text>
            <Text className="text-sm">
              {t('description', { name: name ? `, ${name}` : '' })}
            </Text>
            <Text className="text-sm">{t('message')}</Text>
            <Text className="text-sm">{t('get-started')}</Text>
            <Text className="text-sm">
              <ul className="list-inside list-disc text-sm">
                <li>{t('upload-your-app-store-connect-api-key')}</li>
                <li>{t('run-an-autonomous-keyword-research')}</li>
                <li>{t('generate-aso-contents')}</li>
              </ul>
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${NEXT_PUBLIC_BASE_URL}/dashboard`}
                style={{ padding: '12px 20px' }}
              >
                {t('get-started-button')}
              </Button>
            </Section>
            <Section>
              <Text className="text-sm"></Text>
              <Text className="text-sm">
                <ul className="list-inside list-disc text-sm">
                  <li>
                    {t('star-the-repo')}
                    <Link href={GITHUB_LINK} target="_blank">
                      GitHub
                    </Link>
                  </li>
                  <li>
                    Follow the journey on{' '}
                    <Link href={X_LINK} target="_blank">
                      {t('x-link')}
                    </Link>
                  </li>
                </ul>
              </Text>
            </Section>
            <Section className="mt-4">
              <Text className="text-sm">{tCommon('questions')}</Text>
              <Text className="text-sm text-gray-400">
                {tCommon('shu-from-appagent')}
              </Text>
            </Section>
            <Hr />
            <Section className="mt-8 text-gray-400">
              <Text className="text-xs">
                {tCommon('copyright', { year: new Date().getFullYear() })}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
