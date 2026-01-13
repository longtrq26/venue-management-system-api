import { baseEmailTemplate } from './base.template';

export const emailVerificationTemplate = (fullName: string, url: string) =>
  baseEmailTemplate({
    title: 'Verify your email address',
    heading: 'Verify your email address',
    body: `
      Hi ${fullName},<br /><br />
      You created an account with Venue Management.
      Please confirm that this email address belongs to you to activate your account.
    `,
    actionUrl: url,
    actionText: 'Verify email',
    expiryText: 'This verification link will expire in 15 minutes.',
    footerNote: 'If you did not create this account, you can safely ignore this email.',
  });
