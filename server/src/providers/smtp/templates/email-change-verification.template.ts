import { baseEmailTemplate } from './base.template';

export const emailChangeVerificationTemplate = (fullName: string, url: string) =>
  baseEmailTemplate({
    title: 'Confirm your new email address',
    heading: 'Confirm your new email address',
    body: `
      Hi ${fullName},<br /><br />
      We received a request to change the email address associated with your
      Venue Management account.<br /><br />
      Please confirm your new email address to complete this change.
    `,
    actionUrl: url,
    actionText: 'Confirm new email',
    expiryText: 'This confirmation link will expire in 15 minutes.',
    footerNote:
      'If you did not request this change, ignore this email and your email address will remain unchanged.',
  });
