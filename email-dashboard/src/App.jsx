import { useState, useMemo, useEffect } from 'react';
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
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import Login from './Login';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_k3qomb9';
const EMAILJS_TEMPLATE_ID = 'template_x9nv2us';
const EMAILJS_PUBLIC_KEY = 'KR866gHZs036YXwlu';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Environment options
const ENVIRONMENTS = ['UAT10', 'UAT4', 'UAT3', 'UAT2', 'UAT1', 'PROD', 'DEV'];

// Business Flow options with their codes
const BUSINESS_FLOWS = [
  { label: 'Churchill_SEAMLESS_Dashboard', code: 'Churchill_Seamless_Migration' },
  { label: 'Create B2C Customer with Postpaid SIMO', code: 'NEW_B2C_POSTPAID_SIMO' },
  { label: 'Create B2C Customer with Prepaid SIMO', code: 'NEW_B2C_PREPAID_SIMO' },
  { label: 'Create B2B Customer', code: 'NEW_B2B_CUSTOMER' },
  { label: 'Upgrade Postpaid Plan', code: 'UPGRADE_POSTPAID' },
  { label: 'Downgrade Postpaid Plan', code: 'DOWNGRADE_POSTPAID' },
  { label: 'Add New Line', code: 'ADD_NEW_LINE' },
  { label: 'Cancel Service', code: 'CANCEL_SERVICE' },
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
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    environment: 'UAT10',
    customerId: '',
    businessFlow: BUSINESS_FLOWS[0].code,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('mobileNumber');
    localStorage.removeItem('loginTime');
    setIsAuthenticated(false);
  };

  // Fixed recipient emails
  const RECIPIENT_EMAILS = 'djain@amdocs.com,rafid@amdocs.com';

  // Generate subject based on selections
  const generatedSubject = useMemo(() => {
    // Map business flow code to subject value (keep subject unchanged for Churchill)
    const subjectFlow = formData.businessFlow === 'Churchill_Seamless_Migration' 
      ? 'Churchill_SEAMLESS_Dashboard' 
      : formData.businessFlow;
    const baseSubject = `SITE | ${formData.environment} | ${subjectFlow}`;
    return formData.customerId ? `${baseSubject} | ${formData.customerId}` : baseSubject;
  }, [formData.environment, formData.businessFlow, formData.customerId]);

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
      // EmailJS template parameters
      const templateParams = {
        to_email: RECIPIENT_EMAILS,
        from_name: 'Vodafone_Dashboard',
        from_email: formData.email,
        cc_email: formData.email,  // CC the sender so they get a copy
        subject: generatedSubject,
        message: '(No message)',
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'Email sent successfully!',
          severity: 'success',
        });
        setFormData((prev) => ({ ...prev, email: '', customerId: '' }));
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.text || 'Failed to send email. Check console for details.'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

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
          {/* Header with Logo and Logout */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
            {/* Logout Button */}
            <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: '#e60000',
                  },
                }}
                title="Logout"
              >
                <LogoutIcon />
              </IconButton>
            </Box>
            {/* VodafoneThree Logo */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/VodafoneThree_logo_%282025%29.svg/1200px-VodafoneThree_logo_%282025%29.svg.png"
                alt="VodafoneThree"
                style={{ height: 72, width: 'auto' }}
              />
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: 1,
              }}
            >
              VodafoneThree Dashboard
            </Typography>
            {localStorage.getItem('username') && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  color: 'text.secondary',
                }}
              >
                Logged in as: {localStorage.getItem('username')}
              </Typography>
            )}
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
            <form onSubmit={handleSubmit}>
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
                    <strong style={{ color: '#e60000' }}>To:</strong> {RECIPIENT_EMAILS}
                  </Typography>
                </Box>

                {/* Your Email ID */}
                <TextField
                  fullWidth
                  label="Your Email ID"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@domain.com"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Environment & Customer ID Row */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <FormControl fullWidth>
                    <InputLabel>Environment</InputLabel>
                    <Select
                      name="environment"
                      value={formData.environment}
                      onChange={handleChange}
                      label="Environment"
                    >
                      {ENVIRONMENTS.map((env) => (
                        <MenuItem key={env} value={env}>{env}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Customer (Optional)"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    placeholder="e.g. 564555566"
                  />
                </Box>

                {/* Business Flow */}
                <FormControl fullWidth>
                  <InputLabel>Business Flow</InputLabel>
                  <Select
                    name="businessFlow"
                    value={formData.businessFlow}
                    onChange={handleChange}
                    label="Business Flow"
                  >
                    {BUSINESS_FLOWS.map((flow) => (
                      <MenuItem key={flow.code} value={flow.code}>{flow.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Generated Subject Preview */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(230, 0, 0, 0.08)',
                    borderRadius: 2,
                    border: '1px solid rgba(230, 0, 0, 0.15)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Generated Subject:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#e60000', fontWeight: 500 }}>
                    {generatedSubject}
                  </Typography>
                </Box>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
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
                  {loading ? 'Sending...' : 'Send Email'}
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Footer */}
          <Box
            sx={{
              textAlign: 'center',
              mt: 0,
              pt: 2,
              pb: 0,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              © VodafoneThree Amdocs Testing Team
            </Typography>
          </Box>

          {/* Footer Message */}
          <Box
            sx={{
              textAlign: 'center',
              mt: 0,
              pt: 0,
              pb: 2,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              You will get email response once flow is triggered/completed.
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
