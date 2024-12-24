import WelcomeEmail from '@/components/emails/welcome';

import { sendEmail } from '@/lib/resend';

import { CreateUserEmailProps } from '@/types/user';

export default async function sendWelcomeEmail(params: CreateUserEmailProps) {
  console.log('Sending welcome email to', params.user.email);
  const { name, email } = params.user;
  const emailTemplate = await WelcomeEmail({
    locale: params.locale || 'en',
    name,
  });
  try {
    await sendEmail({
      to: email as string,
      subject: 'Welcome to AppAgent!',
      react: emailTemplate,
      test: process.env.NODE_ENV === 'development',
    });
    console.log('Welcome email sent to', email);
  } catch (e) {
    console.error(e);
  }
}
