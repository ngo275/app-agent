import VerificationLinkEmail from '@/components/emails/verification-link';

import { sendEmail } from '@/lib/resend';
import { WHITE_LABEL_CONFIG } from '@/lib/config';

export default async function sendVerificationRequestEmail(params: {
  locale: string;
  email: string;
  url: string;
}) {
  const { url, email, locale } = params;
  const emailTemplate = await VerificationLinkEmail({ url, locale });
  try {
    await sendEmail({
      to: email as string,
      subject: `Login to ${WHITE_LABEL_CONFIG.appName}!`,
      react: emailTemplate,
      test: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.error(
      `Error sending verification request email to ${email}: ${JSON.stringify(e, null, 2)}`
    );
  }
}
