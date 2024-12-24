import React from 'react';

import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { NEXT_PUBLIC_BASE_URL } from '@/lib/config';
import { createTranslator } from 'next-intl';

interface CancelPlanEmailProps {
  locale: string;
  name: string | null | undefined;
}

const CancelPlanEmail = async ({ locale, name }: CancelPlanEmailProps) => {
  const t = createTranslator({
    locale,
    messages: (await import(`../../../locales/${locale}.json`)).default,
    namespace: 'emails.cancel-plan',
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
            <Text className="font-semibold mx-0 mb-8 mt-4 p-0 text-center text-xl">
              {t('title')}
            </Text>

            <Text className="text-sm leading-6 text-black">
              {tCommon('hi', { name: name ? `, ${name}` : '' })}
            </Text>
            <Text className="text-sm">{t('description')}</Text>
            <Text className="text-sm leading-6 text-black">{t('message')}</Text>
            <Section className="my-8 text-center">
              <Button
                className="rounded bg-black text-center text-xs font-semibold text-white no-underline"
                href={`${NEXT_PUBLIC_BASE_URL}/dashboard`}
                style={{ padding: '12px 20px' }}
              >
                {tCommon('go-to-dashboard')}
              </Button>
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

export default CancelPlanEmail;
