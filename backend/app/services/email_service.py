"""
Email Service — sends password reset OTP emails via Gmail SMTP
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def get_reset_email_html(user_name: str, otp: str, expires_minutes: int = 15) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - SmartGym</title>
</head>
<body style="margin:0;padding:0;background:#0a0b0d;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#161a22;border-radius:16px;border:1px solid #252b38;overflow:hidden;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f1a12,#162a1c);padding:40px;text-align:center;border-bottom:1px solid #252b38;">
              <div style="display:inline-block;background:#00e676;width:50px;height:50px;border-radius:12px;line-height:50px;font-size:24px;font-weight:bold;color:#0a0b0d;margin-bottom:16px;">S</div>
              <h1 style="color:#e8eaf0;margin:0;font-size:28px;letter-spacing:4px;">SMARTGYM</h1>
              <p style="color:#7a8499;margin:8px 0 0;font-size:14px;">AI-Powered Fitness Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#e8eaf0;margin:0 0 8px;font-size:22px;">Password Reset Request</h2>
              <p style="color:#7a8499;margin:0 0 32px;font-size:15px;">Hi {user_name}, we received a request to reset your password.</p>

              <!-- OTP Box -->
              <div style="background:#0f1a12;border:2px solid #00e676;border-radius:12px;padding:32px;text-align:center;margin:0 0 32px;">
                <p style="color:#7a8499;margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Your Reset Code</p>
                <div style="font-size:48px;font-weight:bold;color:#00e676;letter-spacing:16px;font-family:'Courier New',monospace;">
                  {otp}
                </div>
                <p style="color:#4a5468;margin:12px 0 0;font-size:13px;">
                  ⏱ Expires in {expires_minutes} minutes
                </p>
              </div>

              <!-- Instructions -->
              <div style="background:#1e232e;border-radius:10px;padding:20px;margin:0 0 32px;">
                <p style="color:#e8eaf0;margin:0 0 12px;font-size:14px;font-weight:600;">How to reset your password:</p>
                <ol style="color:#7a8499;margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
                  <li>Go back to the SmartGym app</li>
                  <li>Enter the 6-digit code above</li>
                  <li>Create your new password</li>
                </ol>
              </div>

              <!-- Warning -->
              <div style="background:#1a0f0f;border:1px solid #ff4d6d40;border-radius:10px;padding:16px;margin:0 0 32px;">
                <p style="color:#ff4d6d;margin:0;font-size:13px;">
                  🔒 If you didn't request this reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <p style="color:#4a5468;font-size:13px;margin:0;">
                This code is valid for {expires_minutes} minutes only. Do not share it with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111318;padding:24px;text-align:center;border-top:1px solid #252b38;">
              <p style="color:#4a5468;margin:0;font-size:12px;">
                © 2024 SmartGym Platform. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

async def send_reset_email(to_email: str, user_name: str, otp: str) -> bool:
    """
    Send password reset OTP email via Gmail SMTP.
    Returns True if sent successfully, False otherwise.
    """
    try:
        # Check if email is configured
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            print(f"⚠️  Email not configured. OTP for {to_email}: {otp}")
            return False

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔑 Your SmartGym Password Reset Code: {otp}"
        msg["From"]    = f"SmartGym <{settings.MAIL_USERNAME}>"
        msg["To"]      = to_email

        # Plain text fallback
        text_content = f"""
SmartGym Password Reset

Hi {user_name},

Your password reset code is: {otp}

This code expires in 15 minutes.

If you didn't request this, please ignore this email.

SmartGym Team
"""
        # HTML content
        html_content = get_reset_email_html(user_name, otp)

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Send via Gmail SMTP
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_USERNAME, to_email, msg.as_string())

        print(f"✅ Reset email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return False