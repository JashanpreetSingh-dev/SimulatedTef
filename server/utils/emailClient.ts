import { Resend } from 'resend';
import type { ReactElement } from 'react';

type TemplateVariables = Record<string, string | number>;

type TemplatePayload = {
  to: string;
  templateId: string;
  subject?: string;
  // Resend templates accept only string/number variables
  variables?: TemplateVariables;
};

export type ReactEmailAttachment = {
  content: string; // Base64
  filename: string;
  contentId?: string;
};

export type ReactEmailPayload = {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: ReactEmailAttachment[];
  headers?: Record<string, string>;
  from?: string; // Override sender, e.g. "Jashanpreet from Akseli <noreply@akseli.ca>"
};

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

const resend = apiKey ? new Resend(apiKey) : null;

function ensureConfigured(): boolean {
  if (!apiKey || !fromEmail) {
    console.warn(
      'Resend email client is not fully configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable transactional emails.'
    );
    return false;
  }
  if (!resend) {
    console.warn('Resend client is not initialized; emails will not be sent.');
    return false;
  }
  return true;
}

export async function sendTemplateEmail({
  to,
  templateId,
  subject,
  variables = {} as TemplateVariables,
}: TemplatePayload): Promise<void> {
  if (!ensureConfigured()) {
    return;
  }

  try {
    const response = await resend!.emails.send({
      from: fromEmail as string,
      to,
      ...(subject && { subject }),
      template: {
        id: templateId,
        variables,
      },
    });

    if (response.error) {
      console.error('Failed to send email via Resend:', response.error);
    } else {
      console.log('Email sent via Resend:', {
        to,
        templateId,
        id: (response.data as any)?.id,
      });
    }
  } catch (error: any) {
    console.error('Error sending email via Resend:', error?.message || error);
  }
}

export async function sendReactEmail({
  to,
  subject,
  react,
  attachments,
  headers,
  from,
}: ReactEmailPayload): Promise<void> {
  if (!ensureConfigured()) {
    return;
  }

  try {
    const response = await resend!.emails.send({
      from: from || (fromEmail as string),
      to,
      subject,
      react,
      ...(headers && { headers }),
      ...(attachments?.length && {
        attachments: attachments.map((a) => ({
          content: a.content,
          filename: a.filename,
          ...(a.contentId && { contentId: a.contentId }),
        })),
      }),
    });

    if (response.error) {
      console.error('Failed to send email via Resend:', response.error);
    } else {
      console.log('Email sent via Resend (React):', {
        to,
        subject,
        id: (response.data as any)?.id,
      });
    }
  } catch (error: any) {
    console.error('Error sending email via Resend:', error?.message || error);
  }
}

