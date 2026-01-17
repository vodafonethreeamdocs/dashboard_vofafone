import crypto from 'crypto';

// Secret key for signing OTP tokens (must match send-otp.js)
const SECRET_KEY = process.env.OTP_SECRET_KEY || 'vodafonethree-dashboard-secret-key-2026';

// Verify OTP token and check OTP
const verifyOTPToken = (token, email, otp) => {
  try {
    const [payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    if (signature !== expectedSignature) {
      return { valid: false, message: 'Invalid token' };
    }
    
    // Decode payload
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    // Check email matches
    if (data.email !== email) {
      return { valid: false, message: 'Email mismatch' };
    }
    
    // Check expiry
    if (Date.now() > data.expiresAt) {
      return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
    }
    
    // Verify OTP hash
    const otpHash = crypto.createHash('sha256').update(otp + SECRET_KEY).digest('hex');
    if (otpHash !== data.otpHash) {
      return { valid: false, message: 'Invalid OTP. Please try again.' };
    }
    
    return { valid: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, message: 'Invalid token format' };
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, otpToken } = req.body;

  if (!email || !otp || !otpToken) {
    return res.status(400).json({ 
      valid: false, 
      message: 'Email, OTP, and token are required' 
    });
  }

  const result = verifyOTPToken(otpToken, email, otp);
  return res.status(200).json(result);
}

