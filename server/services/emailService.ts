import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  message: string;
  code?: string;
  previewUrl?: string | false;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  username: string,
  otpCode: string
): Promise<SendOtpResult> {
  const host = (process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || 'b66df9001@smtp-brevo.com').trim();
  let pass = (process.env.SMTP_PASS || '').trim();
  const sender = (process.env.SENDER_EMAIL || 'cloudminexsupport@gmail.com').trim();

  // Clean duplicate prefixes in Brevo API/SMTP keys if accidentally duplicated
  if (pass.startsWith('xsmtpsib-xsmtpsib-')) {
    pass = pass.replace('xsmtpsib-xsmtpsib-', 'xsmtpsib-');
  }

  console.log(`[EmailService] Preparing to send 6-digit OTP to ${toEmail} using SMTP host: ${host}:${port}, user: ${user}`);

  if (!pass) {
    console.warn('[EmailService] Warning: SMTP_PASS is empty. Email sending might fail unless configured.');
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"CloudMineX Security" <${sender}>`,
      to: toEmail,
      subject: `CloudMineX - Password Reset Verification Code: ${otpCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07111F; color: #FFFFFF; margin: 0; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #0D1B2A; border-radius: 16px; border: 1px solid #10253A; padding: 32px; box-shadow: 0 10px 30px rgba(0, 212, 168, 0.08); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; }
            .logo-highlight { color: #00D4A8; }
            .badge { display: inline-block; background: rgba(0, 212, 168, 0.1); border: 1px solid rgba(0, 212, 168, 0.3); color: #00D4A8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
            .content { text-align: center; }
            h2 { color: #FFFFFF; font-size: 20px; margin-bottom: 12px; }
            p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
            .otp-box { background: #07111F; border: 2px dashed #00D4A8; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #00D4A8; font-family: monospace; }
            .expiry-note { font-size: 12px; color: #94A3B8; margin-top: 8px; }
            .security-warning { background: rgba(255, 170, 0, 0.08); border-left: 3px solid #FFAA00; padding: 12px; text-align: left; border-radius: 6px; font-size: 12px; color: #E2E8F0; margin-top: 24px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #10253A; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CloudMine<span class="logo-highlight">X</span></div>
              <div class="badge">Security Verification</div>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello <strong style="color: #FFFFFF;">${username}</strong>,</p>
              <p>We received a request to reset your CloudMineX account password. Use the 6-digit verification code below to authorize the update:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <div class="expiry-note">⏱️ Code valid for 10 minutes</div>
              </div>

              <p>If you did not request this password reset, please ignore this email or reach out to support immediately.</p>

              <div class="security-warning">
                🔒 <strong>Security Tip:</strong> Never share your verification code or password with anyone. CloudMineX representatives will never ask for your code.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} CloudMineX Protocol. Automated Cloud Mining Infrastructure.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${toEmail}.`,
    };
  } catch (error: any) {
    console.error('[EmailService] Error sending email via SMTP:', error);
    return {
      success: false,
      message: `Failed to send email via SMTP (${error.message || 'Connection error'}). Please check SMTP configuration.`,
    };
  }
}
