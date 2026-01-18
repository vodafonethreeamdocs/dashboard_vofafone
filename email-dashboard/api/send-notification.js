// EmailJS Configuration (REST API)
const EMAILJS_SERVICE_ID = 'service_k3qomb9';
const EMAILJS_TEMPLATE_ID = 'template_x9nv2us';
const EMAILJS_PUBLIC_KEY = 'KR866gHZs036YXwlu';

// Send email via EmailJS REST API
const sendEmailViaEmailJS = async (templateParams) => {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
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

  const { to_email, from_name, from_email, cc_email, subject, message } = req.body;

  if (!to_email || !subject) {
    return res.status(400).json({ error: 'Missing required fields (to_email, subject)' });
  }

  try {
    // Send email via EmailJS REST API
    await sendEmailViaEmailJS({
      to_email,
      from_name: from_name || 'VodafoneThree Dashboard',
      from_email: from_email || 'noreply@vodafonethree.com',
      cc_email: cc_email || '',
      subject,
      message: message || '',
    });

    console.log('Notification email sent successfully via EmailJS to:', to_email);
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully!',
    });

  } catch (error) {
    console.error('Error sending notification via EmailJS:', error.message || error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send email',
      details: error.message || 'Unknown error'
    });
  }
}

