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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

// Dropdown Options
const ENV_OPTIONS = ['UAT1', 'UAT2', 'UAT4', 'UAT7', 'UAT8', 'UAT9', 'UAT10'];

const SUBJECT_OPTIONS = [
  { label: 'Create B2C Customer with Postpaid SIMO', code: 'NEW_B2C_POSTPAID_SIMO' },
  { label: 'Create B2B Customer with Postpaid SIMO', code: 'NEW_B2B_POSTPAID_SIMO' },
];

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
    cc: '',
    env: 'UAT4',
    subjectType: 'NEW_B2B_POSTPAID_SIMO',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Generate subject from env and subjectType
  const generatedSubject = `SITE | ${formData.env} | ${formData.subjectType}`;

  // Fixed recipient email - change this to your target email
  const RECIPIENT_EMAIL = 'djain@amdocs.com,rafid@amdocs.com';

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

    // Generate subject at submission time
    const emailSubject = `SITE | ${formData.env} | ${formData.subjectType}`;

    try {
      console.log('=== EMAIL SUBMISSION DEBUG ===');
      console.log('formData.env:', formData.env);
      console.log('formData.subjectType:', formData.subjectType);
      console.log('Generated subject:', emailSubject);
      console.log('Service:', EMAILJS_SERVICE_ID);
      console.log('Template:', EMAILJS_TEMPLATE_ID);

      // Use emailjs.send with explicit parameters
      const templateParams = {
        to_email: RECIPIENT_EMAIL,
        from_name: formData.name,
        from_email: formData.email,
        subject: emailSubject,
        message: formData.message || '(No message)',
        cc_email: formData.cc,
      };

      console.log('Template params:', templateParams);

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Response:', response);

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'Email sent successfully via EmailJS!',
          severity: 'success',
        });
        // Only clear message, keep other selections
        setFormData(prev => ({ ...prev, message: '' }));
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
              component="img"
              src="https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/VodafoneThree_logo_%282025%29.svg/1200px-VodafoneThree_logo_%282025%29.svg.png"
              alt="VodafoneThree Logo"
              sx={{
                width: 200,
                height: 'auto',
                objectFit: 'contain',
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              VodafoneThree Dashboard
            </Typography>
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
              <input type="hidden" name="subject" value={generatedSubject} />
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

                {/* Your Email ID (functions as CC) */}
                <TextField
                  fullWidth
                  label="Your Email ID"
                  name="cc"
                  type="text"
                  value={formData.cc}
                  onChange={handleChange}
                  placeholder="your.email@domain.com"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Environment and Subject Dropdowns */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Environment Dropdown */}
                  <FormControl fullWidth required>
                    <InputLabel>Environment</InputLabel>
                    <Select
                      name="env"
                      value={formData.env}
                      onChange={handleChange}
                      label="Environment"
                    >
                      {ENV_OPTIONS.map((env) => (
                        <MenuItem key={env} value={env}>
                          {env}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Business Flow Dropdown */}
                  <FormControl fullWidth required>
                    <InputLabel>Business Flow</InputLabel>
                    <Select
                      name="subjectType"
                      value={formData.subjectType}
                      onChange={handleChange}
                      label="Business Flow"
                    >
                      {SUBJECT_OPTIONS.map((option) => (
                        <MenuItem key={option.code} value={option.code}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Generated Subject Preview */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(230, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(230, 0, 0, 0.3)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Generated Subject:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.light' }}>
                    {generatedSubject}
                  </Typography>
                </Box>

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

              </Box>
            </form>

          </Paper>
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
