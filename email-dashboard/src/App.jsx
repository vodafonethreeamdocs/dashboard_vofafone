import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { ref, get, remove, onValue } from 'firebase/database';
import { db } from './firebase';
import Login from './Login';
import AdminStatsPanel from './AdminStatsPanel';
import { logAuditEvent, AUDIT_ACTIONS, getEmailCountByUser } from './auditService';

// Admin users who can see usage stats
const ADMIN_EMAILS = [
  'rafi.diamant@amdocs.com',
  'deepak.jain2@amdocs.com',
  'rafid@amdocs.com',
  'djain@amdocs.com',
];

// API Base URL for Vercel functions
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Environment options
const ENVIRONMENTS = ['UAT10', 'UAT4', 'UAT3', 'UAT2', 'UAT1', 'PROD', 'DEV'];

// Business Flow options with their codes
const BUSINESS_FLOWS = [
  { label: 'Churchill_SEAMLESS_Dashboard_B2C', code: 'Churchill_Seamless_Migration_B2C' },
  { label: 'Churchill_SEAMLESS_Dashboard_B2B', code: 'Churchill_Seamless_Migration_B2B' },
  { label: 'Create B2C Customer with Postpaid SIMO', code: 'NEW_B2C_POSTPAID_SIMO' },
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
    environment: 'UAT10',
    customerId: '',
    businessFlow: BUSINESS_FLOWS[0].code,
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [emailSentCount, setEmailSentCount] = useState(0);

  // Check authentication on mount and verify session
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch email sent count for logged-in user
  const fetchEmailCount = useCallback(async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;
    
    try {
      const counts = await getEmailCountByUser();
      setEmailSentCount(counts[userEmail] || 0);
    } catch (error) {
      console.error('Error fetching email count:', error);
    }
  }, []);

  // Fetch email count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEmailCount();
    }
  }, [isAuthenticated, fetchEmailCount]);

  // Verify session to prevent concurrent logins
  useEffect(() => {
    if (!isAuthenticated) return;

    const userEmail = localStorage.getItem('userEmail');
    const localSessionId = localStorage.getItem('sessionId');
    
    if (!userEmail || !localSessionId) return;

    const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
    const sessionRef = ref(db, `activeSessions/${sanitizedEmail}`);

    // Listen for session changes in real-time
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data || data.sessionId !== localSessionId) {
        // Session mismatch - user logged in from another device
        setSnackbar({
          open: true,
          message: 'You have been logged out because your account was accessed from another device',
          severity: 'warning',
        });
        
        // Log the forced logout
        logAuditEvent(userEmail, AUDIT_ACTIONS.LOGOUT, {
          reason: 'concurrent_login_detected',
          forcedLogout: true
        });
        
        // Clear local storage and logout
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('mobileNumber');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('sessionId');
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Check if current user is admin
  const currentUserEmail = localStorage.getItem('userEmail') || '';
  const isAdmin = ADMIN_EMAILS.includes(currentUserEmail.toLowerCase());

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = useCallback(async () => {
    const userEmail = localStorage.getItem('userEmail');
    
    // Clear session from Firebase
    if (userEmail) {
      const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
      const sessionRef = ref(db, `activeSessions/${sanitizedEmail}`);
      try {
        await remove(sessionRef);
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
    
    // Log logout event
    logAuditEvent(userEmail, AUDIT_ACTIONS.LOGOUT, {});
    
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('mobileNumber');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('sessionId');
    setIsAuthenticated(false);
  }, []);

  // Inactivity timeout - logout after 15 minutes of inactivity
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer - only if authenticated
    if (isAuthenticated) {
      inactivityTimerRef.current = setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'You have been logged out due to 15 minutes of inactivity',
          severity: 'warning',
        });
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, handleLogout]);

  // Set up inactivity listeners when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timer if not authenticated
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Start the initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Fixed recipient emails
  const RECIPIENT_EMAILS = 'djain@amdocs.com,rafid@amdocs.com';

  // Generate subject based on selections
  const generatedSubject = useMemo(() => {
    // Map business flow code to subject value (keep subject unchanged for Churchill)
    let subjectFlow = formData.businessFlow;
    if (formData.businessFlow === 'Churchill_Seamless_Migration_B2C') {
      subjectFlow = 'Churchill_SEAMLESS_Dashboard_B2C';
    } else if (formData.businessFlow === 'Churchill_Seamless_Migration_B2B') {
      subjectFlow = 'Churchill_SEAMLESS_Dashboard_B2B';
    }
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
      // Send via Vercel API (routes through server to bypass corporate firewall)
      const response = await fetch(`${API_BASE_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: RECIPIENT_EMAILS,
          from_name: 'Vodafone_Dashboard',
          from_email: currentUserEmail,
          cc_email: currentUserEmail,  // CC the sender so they get a copy
          subject: generatedSubject,
          message: '(No message)',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Log successful email send
        logAuditEvent(currentUserEmail, AUDIT_ACTIONS.SEND_EMAIL, {
          environment: formData.environment,
          businessFlow: formData.businessFlow,
          customerId: formData.customerId || null,
          subject: generatedSubject,
          recipients: RECIPIENT_EMAILS,
        });
        
        // Increment email sent counter
        setEmailSentCount(prev => prev + 1);
        
        setSnackbar({
          open: true,
          message: 'Email sent successfully!',
          severity: 'success',
        });
        setFormData((prev) => ({ ...prev, customerId: '' }));
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send Email Error:', error);
      
      // Log failed email send
      logAuditEvent(currentUserEmail, AUDIT_ACTIONS.SEND_EMAIL_FAILED, {
        environment: formData.environment,
        businessFlow: formData.businessFlow,
        error: error.message,
      });
      
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
            {/* Email Sent Counter - Top Left */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ color: '#e60000', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                Emails Sent: <span style={{ color: '#e60000', fontWeight: 700 }}>{emailSentCount}</span>
              </Typography>
            </Box>
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
            {localStorage.getItem('userEmail') && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  color: 'text.secondary',
                }}
              >
                Logged in as: {localStorage.getItem('userEmail')}
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

                {/* Your Email ID - Auto-populated from logged-in user */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(230, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(230, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong style={{ color: '#e60000' }}>Your Email ID:</strong> {currentUserEmail}
                  </Typography>
                </Box>

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

          {/* Admin Stats Panel - Only visible to admins */}
          {isAdmin && <AdminStatsPanel />}
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
