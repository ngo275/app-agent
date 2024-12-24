import VerificationLinkEmail from '@/components/emails/verification-link';

import { sendEmail } from '@/lib/resend';

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
      subject: 'Login to AppAgent!',
      react: emailTemplate,
      test: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.error(
      `Error sending verification request email to ${email}: ${JSON.stringify(e, null, 2)}`
    );
  }
}
