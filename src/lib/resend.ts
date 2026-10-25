import { JSXElementConstructor, ReactElement } from 'react';

// import { render } from "@react-email/components";
import { Resend } from 'resend';

// import { log, nanoid } from "@/lib/utils";
import { randomString } from '@/lib/utils/string';
import { RESEND_API_KEY, EMAIL_FROM } from '@/lib/config';

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const sendEmail = async ({
  to,
  subject,
  react,
  marketing,
  system,
  verify,
  test,
  cc,
  scheduledAt,
}: {
  to: string;
  subject: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  react: ReactElement<any, string | JSXElementConstructor<any>>;
  marketing?: boolean;
  system?: boolean;
  verify?: boolean;
  test?: boolean;
  cc?: string | string[];
  scheduledAt?: string;
}) => {
  if (!resend || !EMAIL_FROM) {
    // Throw an error if resend is not initialized
    throw new Error(
      'Configure RESEND_API_KEY and a verified EMAIL_FROM sender'
    );
  }
  // const plainText = await render(react, { plainText: true });

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: test ? 'delivered@resend.dev' : to,
      cc: cc,
      subject,
      react,
      scheduledAt,
      // text: plainText,
      headers: {
        'X-Entity-Ref-ID': randomString(),
      },
    });

    // Check if the email sending operation returned an error and throw it
    if (error) {
      console.error({
        message: `Resend returned error when sending email: ${error.name} \n\n ${error.message}`,
        type: 'error',
        mention: true,
      });
      throw error;
    }

    // If there's no error, return the data
    return data;
  } catch (exception) {
    // Log and rethrow any caught exceptions for upstream handling
    console.error({
      message: `Unexpected error when sending email: ${exception}`,
      type: 'error',
      mention: true,
    });
    throw exception; // Rethrow the caught exception
  }
};
