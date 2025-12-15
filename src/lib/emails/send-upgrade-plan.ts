import { sendEmail } from '@/lib/resend';
import { WHITE_LABEL_CONFIG } from '@/lib/config';
import UpgradePlanEmail from '@/components/emails/upgrade-plan';

export default async function sendUpgradePlanEmail(params: {
  locale: string;
  user: {
    email: string;
    name: string;
  };
  planType: string;
}) {
  const { user, planType, locale } = params;
  const emailTemplate = await UpgradePlanEmail({
    name: user.name,
    planType,
    locale,
  });
  try {
    await sendEmail({
      to: user.email,
      subject: `Thank you for upgrading your ${WHITE_LABEL_CONFIG.appName} plan!`,
      react: emailTemplate,
      test: process.env.NODE_ENV === 'development',
    });
  } catch (e) {
    console.error(
      `Error sending upgrade plan email to ${user.email}: ${JSON.stringify(e, null, 2)}`
    );
  }
}
