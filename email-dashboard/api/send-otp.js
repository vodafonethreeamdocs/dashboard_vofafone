import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Secret key for signing OTP tokens
const SECRET_KEY = process.env.OTP_SECRET_KEY || 'vodafonethree-dashboard-secret-key-2026';

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Create a signed token containing OTP info
const createOTPToken = (email, otp) => {
  const data = {
    email,
    otpHash: crypto.createHash('sha256').update(otp + SECRET_KEY).digest('hex'),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return `${payload}.${signature}`;
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const otp = generateOTP();
  const otpToken = createOTPToken(email, otp);

  try {
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'VodafoneThree Dashboard <onboarding@resend.dev>',
      to: email,
      subject: 'VodafoneThree Dashboard - Your OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f0f12; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f12; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background-color: #1a1a21; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <img src="https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/VodafoneThree_logo_%282025%29.svg/1200px-VodafoneThree_logo_%282025%29.svg.png" alt="VodafoneThree" style="height: 60px; width: auto;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 400; font-style: italic; margin: 0;">VodafoneThree Dashboard</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <p style="color: #a0a0b0; font-size: 16px; margin: 0;">Your one-time password (OTP) is:</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="background-color: rgba(230, 0, 0, 0.1); border: 1px solid rgba(230, 0, 0, 0.2); border-radius: 12px; padding: 20px 40px; display: inline-block;">
                        <span style="color: #e60000; font-size: 36px; font-weight: 600; letter-spacing: 8px;">${otp}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 16px;">
                      <p style="color: #a0a0b0; font-size: 14px; margin: 0;">This code expires in <strong style="color: #e60000;">5 minutes</strong>.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p style="color: #666666; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 24px;">
                <p style="color: #666666; font-size: 12px; margin: 0;">© VodafoneThree Amdocs Testing Team</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email' });
    }

    console.log('Email sent successfully:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully to your email',
      otpToken, // Return token for verification
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
}

