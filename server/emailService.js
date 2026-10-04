import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let transporter = null;
let transporterMode = 'UNKNOWN';

export async function getTransporter() {
  if (transporter) {
    return { transporter, mode: transporterMode };
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL_PROVIDER_API_KEY
  } = process.env;

  // Case 1: SendGrid API Key or Generic Provider API Key
  if (EMAIL_PROVIDER_API_KEY && EMAIL_PROVIDER_API_KEY.trim() !== '') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: EMAIL_PROVIDER_API_KEY.trim()
      }
    });
    transporterMode = 'SENDGRID_API';
    console.log('[EmailService] Configured SendGrid API transport.');
    return { transporter, mode: transporterMode };
  }

  // Case 2: Configured SMTP (Gmail, Outlook, Amazon SES, Mailgun, etc.)
  if (SMTP_USER && SMTP_PASS && SMTP_USER.trim() !== '' && SMTP_PASS.trim() !== '') {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER.trim(),
        pass: SMTP_PASS.trim()
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    transporterMode = `SMTP (${SMTP_HOST || 'custom'})`;
    console.log(`[EmailService] Configured live SMTP transport (${SMTP_HOST}:${SMTP_PORT}).`);
    return { transporter, mode: transporterMode };
  }

  // Case 3: Development / Sandbox Mode (Safe Fallback)
  // Creates an ephemeral test transport or mock logger so the system operates cleanly in test environments
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    transporterMode = 'ETHEREAL_SANDBOX';
    console.log('[EmailService] Configured Ethereal Sandbox transport for development.');
    return { transporter, mode: transporterMode };
  } catch (err) {
    // If offline or network blocks ethereal, use JSON / Stream transport
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    transporterMode = 'MOCK_STREAM';
    console.log('[EmailService] Configured local mock stream transport.');
    return { transporter, mode: transporterMode };
  }
}

/**
 * Generate exact subject and content per requirements:
 * Subject: Daily Report Pending – [DATE]
 * Body text:
 * Hello [NAME],
 *
 * This is a reminder that your Daily Report for today ([DATE]) has not been submitted yet.
 *
 * Please submit your report as soon as possible.
 *
 * Click here to submit: [PORTAL_URL]
 *
 * Thank you.
 */
export function buildReminderEmailContent({ name, date, portalUrl }) {
  const subject = `Daily Report Pending – ${date}`;

  const plainText = 
`Hello ${name},

This is a reminder that your Daily Report for today (${date}) has not been submitted yet.

Please submit your report as soon as possible.

Click here to submit: ${portalUrl}

Thank you.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .email-container {
      max-width: 580px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #C60003;
      padding: 24px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 30px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .message-body {
      font-size: 15px;
      color: #334155;
      margin-bottom: 24px;
    }
    .highlight-card {
      background-color: #fff1f2;
      border-left: 4px solid #C60003;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #9f1239;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background-color: #C60003;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 9999px;
      box-shadow: 0 4px 12px rgba(198, 0, 3, 0.3);
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Commonwealth University College of Medicine</h1>
      <p>Daily Operations & Governance Portal</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      
      <div class="message-body">
        This is a reminder that your Daily Report for today (<strong>${date}</strong>) has not been submitted yet.
      </div>

      <div class="highlight-card">
        ⏰ <strong>Compliance Action Required:</strong> Daily reporting is mandatory for institutional coordination and patient safety workflows.
      </div>
      
      <div class="message-body">
        Please submit your report as soon as possible.
      </div>

      <div class="cta-container">
        <a href="${portalUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          Click here to submit your report
        </a>
      </div>

      <div class="message-body" style="font-size: 13px; color: #64748b; word-break: break-all;">
        Direct link: <a href="${portalUrl}" style="color: #C60003;">${portalUrl}</a>
      </div>

      <div class="message-body" style="margin-top: 24px;">
        Thank you.
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Commonwealth University College of Medicine (CUCOM)</strong></p>
      <p style="margin: 0;">Automated Management Notification • Sent on ${date}</p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, plainText, html };
}

/**
 * Dispatches an automated email reminder to a manager
 */
export async function sendReminderEmail({ to, name, date, portalUrl = process.env.PORTAL_URL || 'http://localhost:3000' }) {
  if (!to || to.trim() === '') {
    throw new Error('MISSING_EMAIL: Recipient email address is missing or empty');
  }

  const { transporter: mailer, mode } = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"CUCOM Executive Office" <dean@cucom.edu.ag>';
  const { subject, plainText, html } = buildReminderEmailContent({ name, date, portalUrl });

  const mailOptions = {
    from: fromAddress,
    to: to.trim(),
    subject,
    text: plainText,
    html
  };

  const info = await mailer.sendMail(mailOptions);
  
  let previewUrl = null;
  if (mode === 'ETHEREAL_SANDBOX') {
    previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Preview URL for ${to}: ${previewUrl}`);
    }
  }

  return {
    success: true,
    messageId: info.messageId || 'local-msg-' + Date.now(),
    mode,
    previewUrl,
    response: info.response || (info.message ? 'JSON_STREAM' : 'SENT')
  };
}
