import { baseEmailTemplate } from './base.template';

export const passwordResetRequestTemplate = (fullName: string, url: string) =>
  baseEmailTemplate({
    title: 'Reset your password',
    heading: 'Reset your password',
    body: `
      Hi ${fullName},<br /><br />
      We received a request to reset the password for your Venue Management account.
      Click the button below to set a new password.
    `,
    actionUrl: url,
    actionText: 'Reset password',
    expiryText: 'This password reset link will expire in 15 minutes.',
    footerNote: 'If you did not request a password reset, you can safely ignore this email.',
  });
