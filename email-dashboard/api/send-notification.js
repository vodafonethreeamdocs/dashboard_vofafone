import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { to_emails, cc_email, from_email, subject, environment, businessFlow, customerId } = req.body;

  if (!to_emails || !subject) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Parse recipient emails (comma-separated string to array)
    const toArray = to_emails.split(',').map(email => email.trim());

    // Build email options
    const emailOptions = {
      from: 'VodafoneThree Dashboard <onboarding@resend.dev>',
      to: toArray,
      subject: subject,
      replyTo: from_email,
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
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a21; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px;">
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
                    <td align="center" style="padding-bottom: 8px;">
                      <p style="color: #a0a0b0; font-size: 14px; margin: 0;">New Request Notification</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(230, 0, 0, 0.1); border: 1px solid rgba(230, 0, 0, 0.2); border-radius: 12px; padding: 20px;">
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #a0a0b0; font-size: 14px;">Environment:</span>
                            <span style="color: #e60000; font-size: 16px; font-weight: 600; margin-left: 10px;">${environment || 'N/A'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #a0a0b0; font-size: 14px;">Business Flow:</span>
                            <span style="color: #ffffff; font-size: 16px; font-weight: 500; margin-left: 10px;">${businessFlow || 'N/A'}</span>
                          </td>
                        </tr>
                        ${customerId ? `
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #a0a0b0; font-size: 14px;">Customer ID:</span>
                            <span style="color: #ffffff; font-size: 16px; font-weight: 500; margin-left: 10px;">${customerId}</span>
                          </td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #a0a0b0; font-size: 14px;">Requested by:</span>
                            <span style="color: #ffffff; font-size: 16px; font-weight: 500; margin-left: 10px;">${from_email || 'N/A'}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 16px;">
                      <div style="background-color: rgba(230, 0, 0, 0.15); border-radius: 8px; padding: 12px 24px; display: inline-block;">
                        <span style="color: #e60000; font-size: 14px; font-weight: 600;">Subject: ${subject}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 24px;">
                      <p style="color: #666666; font-size: 12px; margin: 0;">This is an automated notification from VodafoneThree Dashboard.</p>
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
    };

    // Add CC if provided
    if (cc_email) {
      emailOptions.cc = [cc_email];
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email' });
    }

    console.log('Notification email sent:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully!',
      id: data.id 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

