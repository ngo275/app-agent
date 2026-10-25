import CancelPlanEmail from '@/components/emails/cancel-plan';
import { sendEmail } from '@/lib/resend';
import { WHITE_LABEL_CONFIG } from '@/lib/config';

export default async function sendCancelPlanEmail(params: {
  locale: string;
  user: {
    email: string;
    name: string;
  };
}) {
  const { user, locale } = params;
  const emailTemplate = await CancelPlanEmail({ name: user.name, locale });
  try {
    await sendEmail({
      to: user.email,
      subject: `Your ${WHITE_LABEL_CONFIG.appName} plan has been canceled`,
      react: emailTemplate,
      test: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.error(
      `Error sending cancel plan email to ${user.email}: ${JSON.stringify(e, null, 2)}`
    );
  }
}
