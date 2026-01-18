import crypto from 'crypto';

// EmailJS Configuration (REST API)
const EMAILJS_SERVICE_ID = 'service_k3qomb9';
const EMAILJS_TEMPLATE_ID = 'template_x9nv2us';
const EMAILJS_PUBLIC_KEY = 'KR866gHZs036YXwlu';

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

// Send email via EmailJS REST API
const sendEmailViaEmailJS = async (toEmail, otp) => {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        from_name: 'VodafoneThree Dashboard',
        from_email: 'noreply@vodafonethree.com',
        cc_email: '',
        subject: 'VodafoneThree Dashboard - Your OTP Code',
        message: `Your one-time password (OTP) is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('EmailJS API response:', errorText);
    throw new Error(`EmailJS error: ${errorText}`);
  }

  return { success: true };
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
    // Send email via EmailJS REST API
    await sendEmailViaEmailJS(email, otp);

    console.log('OTP email sent successfully via EmailJS to:', email);
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully to your email',
      otpToken, // Return token for verification
    });

  } catch (error) {
    console.error('Error sending OTP via EmailJS:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send OTP',
      details: error.message || 'Unknown error'
    });
  }
}
