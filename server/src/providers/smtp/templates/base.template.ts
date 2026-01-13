export const baseEmailTemplate = ({
  title,
  heading,
  body,
  actionUrl,
  actionText,
  expiryText,
  footerNote,
}: {
  title: string;
  heading: string;
  body: string;
  actionUrl: string;
  actionText: string;
  footerNote: string;
  expiryText: string;
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #000;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
      "
    >
      <tr>
        <td style="text-align: center; padding-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
            ${heading}
          </h1>
        </td>
      </tr>

      <tr>
        <td style="font-size: 16px; line-height: 1.5; padding-bottom: 24px;">
          ${body}
        </td>
      </tr>

      <tr>
        <td style="text-align: center; padding: 24px 0;">
          <a
            href="${actionUrl}"
            style="
              display: inline-block;
              background: #000;
              color: #fff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
            "
          >
            ${actionText}
          </a>
        </td>
      </tr>

      <tr>
        <td style="font-size: 14px; line-height: 1.4; padding-bottom: 24px;">
          If the button doesn’t work, copy and paste this link into your browser:
          <br />
          <a
            href="${actionUrl}"
            style="color: #000; word-break: break-all;"
          >
            ${actionUrl}
          </a>
        </td>
      </tr>

      <tr>
        <td style="font-size: 14px; color: #555; padding-bottom: 24px;">
          ${expiryText}
        </td>
      </tr>

      <tr>
        <td
          style="
            font-size: 12px;
            color: #888;
            border-top: 1px solid #eaeaea;
            padding-top: 24px;
          "
        >
          ${footerNote}
        </td>
      </tr>
    </table>
  </body>
</html>
`;
};
