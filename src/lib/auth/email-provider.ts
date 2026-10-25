import type { EmailConfig, EmailUserConfig } from 'next-auth/providers/email';

/** HTTP-only email provider; delivery is supplied by the caller, not SMTP. */
export default function createEmailProvider(
  options: EmailUserConfig &
    Required<Pick<EmailUserConfig, 'sendVerificationRequest'>>
): EmailConfig {
  return {
    id: 'email',
    type: 'email',
    name: 'Email',
    server: { host: 'localhost', port: 25, auth: { user: '', pass: '' } },
    from: 'NextAuth <no-reply@example.com>',
    maxAge: 24 * 60 * 60,
    sendVerificationRequest: options.sendVerificationRequest,
    options,
  };
}
