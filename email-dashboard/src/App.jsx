import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  Message as MessageIcon,
  ContentCopy as CcIcon,
} from '@mui/icons-material';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_szxtldd';
const EMAILJS_TEMPLATE_ID = 'template_0sgk7an';
const EMAILJS_PUBLIC_KEY = 'DvCpUl264wY5TvDKU';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Dark theme with red accent (Vodafone-style)
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e60000',
      light: '#ff3333',
      dark: '#b30000',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#0f0f12',
      paper: '#1a1a21',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0b0',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const formRef = useRef();
  const [formData, setFormData] = useState({
    name: 'Vodafone_Dashboard',
    email: 'ds56dfddrt@gmail.com',
    cc: 'rafi.diamant@amdocs.com,amdtestb2cuk@gmail.com,autotrigger@incetuk002.corp.amdocs.com,shivam.sinha@amdocs.com,ds56dfddrt@gmail.com',
    subject: 'SITE | UAT4 | NEW_B2B_POSTPAID_SIMO',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fixed recipient email - change this to your target email
  const RECIPIENT_EMAIL = 'djain@amdocs.com';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Using sendForm method...');
      console.log('Service:', EMAILJS_SERVICE_ID);
      console.log('Template:', EMAILJS_TEMPLATE_ID);
      console.log('Form ref:', formRef.current);

      // Use sendForm method - submits the actual form element
      const response = await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Response:', response);

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'Email sent successfully via EmailJS!',
          severity: 'success',
        });
        setFormData({ name: 'Vodafone_Dashboard', email: 'ds56dfddrt@gmail.com', cc: 'rafi.diamant@amdocs.com,amdtestb2cuk@gmail.com,autotrigger@incetuk002.corp.amdocs.com,shivam.sinha@amdocs.com,ds56dfddrt@gmail.com', subject: 'SITE | UAT4 | NEW_B2B_POSTPAID_SIMO', message: '' });
      } else {
        throw new Error('EmailJS returned non-200 status');
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to send email. Check console for details.'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Debug function to test network connectivity
  const testConnectivity = async () => {
    const results = [];
    
    // Test 1: Public API (should always work)
    try {
      const res1 = await fetch('https://httpbin.org/get');
      results.push(`✅ httpbin.org: ${res1.status}`);
    } catch (e) {
      results.push(`❌ httpbin.org: ${e.message}`);
    }
    
    // Test 2: EmailJS API
    try {
      const res2 = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      results.push(`✅ api.emailjs.com: ${res2.status}`);
    } catch (e) {
      results.push(`❌ api.emailjs.com: ${e.message}`);
    }
    
    // Test 3: FormSubmit
    try {
      const res3 = await fetch('https://formsubmit.co/ajax/test@test.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      results.push(`✅ formsubmit.co: ${res3.status}`);
    } catch (e) {
      results.push(`❌ formsubmit.co: ${e.message}`);
    }
    
    // Test 4: Web3Forms
    try {
      const res4 = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: 'test' })
      });
      results.push(`✅ api.web3forms.com: ${res4.status}`);
    } catch (e) {
      results.push(`❌ api.web3forms.com: ${e.message}`);
    }
    
    setSnackbar({
      open: true,
      message: results.join(' | '),
      severity: 'info',
    });
    console.log('Connectivity Test Results:', results);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f0f12 0%, #1a1a21 50%, #0f0f12 100%)',
          py: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at top left, rgba(230, 0, 0, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(230, 0, 0, 0.05) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                borderRadius: 3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 8px 32px rgba(230, 0, 0, 0.3)',
              }}
            >
              <EmailIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Email Test Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Send test emails from external sources to Amdocs
            </Typography>
            <Chip
              label="EmailJS • Free • No Backend"
              size="small"
              sx={{ mt: 1, bgcolor: 'rgba(230, 0, 0, 0.15)', color: 'primary.light' }}
            />
          </Box>

          {/* Main Form Card */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Hidden fields for EmailJS template */}
              <input type="hidden" name="to_email" value={RECIPIENT_EMAIL} />
              <input type="hidden" name="from_name" value={formData.name} />
              <input type="hidden" name="from_email" value={formData.email} />
              <input type="hidden" name="subject" value={formData.subject} />
              <input type="hidden" name="message" value={formData.message || '(No message)'} />
              <input type="hidden" name="cc_email" value={formData.cc} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Recipient Info */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(230, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(230, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong style={{ color: '#e60000' }}>To:</strong> {RECIPIENT_EMAIL}
                  </Typography>
                </Box>

                {/* Name & Email Row */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Your Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@external-company.com"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>

                {/* CC Email */}
                <TextField
                  fullWidth
                  label="CC (Optional)"
                  name="cc"
                  type="text"
                  value={formData.cc}
                  onChange={handleChange}
                  placeholder="email1@domain.com, email2@domain.com"
                  helperText="Add additional recipients (comma-separated for multiple)"
                  InputProps={{
                    startAdornment: <CcIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Subject */}
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Test Email Subject"
                  InputProps={{
                    startAdornment: <SubjectIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Message */}
                <TextField
                  fullWidth
                  label="Message (Optional)"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  multiline
                  rows={5}
                  placeholder="Write your test message here..."
                  InputProps={{
                    startAdornment: (
                      <MessageIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1.5 }} />
                    ),
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    boxShadow: '0 8px 24px rgba(230, 0, 0, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(230, 0, 0, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Test Email'}
                </Button>

                {/* Mailto fallback button */}
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<EmailIcon />}
                  onClick={() => {
                    const mailtoUrl = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}${formData.cc ? `&cc=${encodeURIComponent(formData.cc)}` : ''}`;
                    window.open(mailtoUrl, '_blank');
                  }}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.6)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  Open in Email Client (Fallback)
                </Button>

                {/* Debug connectivity button */}
                <Button
                  variant="text"
                  color="secondary"
                  fullWidth
                  onClick={testConnectivity}
                  sx={{
                    mt: 1,
                    py: 1,
                    fontSize: '0.75rem',
                    opacity: 0.6,
                    '&:hover': { opacity: 1 },
                  }}
                >
                  🔧 Test Network Connectivity
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3 }} />

            {/* Info Card */}
            <Card
              sx={{
                bgcolor: 'rgba(230, 0, 0, 0.08)',
                border: '1px solid rgba(230, 0, 0, 0.2)',
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" color="primary.light" gutterBottom>
                  📧 First Time Setup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Emails are sent via EmailJS from your connected Gmail account.
                  No activation needed - emails are sent directly from your Gmail.
                </Typography>
              </CardContent>
            </Card>
          </Paper>

          {/* Destination Info */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              All emails are sent to: <strong style={{ color: '#e60000' }}>{RECIPIENT_EMAIL}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Use the CC field to add additional recipients
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
