import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Lock as LockIcon,
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  Input as InputIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from './firebase';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService';

// Vercel API base URL (will be set to deployed URL in production)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Send Email OTP via Vercel API (Resend)
const sendEmailOTP = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    return data;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw error;
  }
};

// Verify Email OTP via Vercel API
const validateEmailOTP = async (email, otp, otpToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, otpToken }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return { valid: false, message: 'An error occurred. Please try again.' };
  }
};

function Login({ onLoginSuccess }) {
  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Step 2: Email OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [otpToken, setOtpToken] = useState(''); // Token for OTP verification
  
  // UI State
  const [step, setStep] = useState('credentials'); // 'credentials', 'emailOtp'
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Countdown timer for resend OTP
  const startEmailResendTimer = () => {
    setEmailResendTimer(60);
    const interval = setInterval(() => {
      setEmailResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Handle Email/Password Submit (Firebase Auth)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both email and password',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Send Email OTP via Vercel/Resend
      const result = await sendEmailOTP(email);
      if (result.success) {
        setOtpToken(result.otpToken); // Store token for verification
        setStep('emailOtp');
        startEmailResendTimer();
        
        // Log OTP sent event
        logAuditEvent(email, AUDIT_ACTIONS.OTP_SENT, { 
          step: 'email_otp',
          success: true 
        });
        
        setSnackbar({
          open: true,
          message: 'Credentials verified! ' + result.message,
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Login Error:', error);
      
      // Log failed login attempt
      logAuditEvent(email, AUDIT_ACTIONS.LOGIN_FAILED, { 
        errorCode: error.code,
        errorMessage: error.message 
      });
      
      let errorMessage = 'Invalid email or password';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Email OTP Submit - Completes Login
  const handleEmailOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (emailOtp.length !== 6) {
      setSnackbar({
        open: true,
        message: 'Please enter a 6-digit OTP',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await validateEmailOTP(email, emailOtp, otpToken);
      if (result.valid) {
        // Generate unique session ID for concurrent login prevention
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store session in Firebase to prevent concurrent logins
        const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');
        const sessionRef = ref(db, `activeSessions/${sanitizedEmail}`);
        await set(sessionRef, {
          sessionId: sessionId,
          loginTime: Date.now(),
          userAgent: navigator.userAgent
        });
        
        // Store authentication in localStorage - Complete login
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('loginTime', Date.now().toString());
        localStorage.setItem('sessionId', sessionId);
        
        // Log successful login
        logAuditEvent(email, AUDIT_ACTIONS.LOGIN_SUCCESS, { 
          method: '2-layer-auth',
          steps: ['firebase', 'email_otp']
        });
        
        setSnackbar({
          open: true,
          message: 'Login successful! Welcome to VodafoneThree Dashboard',
          severity: 'success',
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        // Log failed OTP verification
        logAuditEvent(email, AUDIT_ACTIONS.OTP_FAILED, { 
          step: 'email_otp',
          message: result.message 
        });
        
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error',
        });
        setEmailOtp('');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend Email OTP handler
  const handleResendEmailOtp = async () => {
    if (emailResendTimer > 0) return;
    
    setLoading(true);
    try {
      const result = await sendEmailOTP(email);
      if (result.success) {
        setOtpToken(result.otpToken); // Update token
        startEmailResendTimer();
        setEmailOtp('');
        setSnackbar({
          open: true,
          message: 'Email OTP resent successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to resend OTP. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Navigation handlers
  const handleBackToCredentials = () => {
    setStep('credentials');
    setEmailOtp('');
    setOtpToken('');
    setEmailResendTimer(0);
  };

  // Get step description
  const getStepDescription = () => {
    switch (step) {
      case 'credentials':
        return 'Enter your credentials to continue';
      case 'emailOtp':
        return 'Enter the OTP sent to your email';
      default:
        return '';
    }
  };

  // Get step indicator
  const getStepIndicator = () => {
    const steps = ['credentials', 'emailOtp'];
    const currentIndex = steps.indexOf(step);
    return `Step ${currentIndex + 1} of 2`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f12 0%, #1a1a21 50%, #0f0f12 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
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
              color: '#ffffff',
            }}
          >
            VodafoneThree Dashboard
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              color: '#e60000',
              fontWeight: 500,
            }}
          >
            {getStepIndicator()}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1,
              color: 'text.secondary',
            }}
          >
            {getStepDescription()}
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Enter your registered email address"
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ minWidth: 'auto', p: 1, color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                  helperText="Enter your password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !email || !password}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <InputIcon />}
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
                  {loading ? 'Validating...' : 'Continue'}
                </Button>
              </Box>
            </form>
          )}

          {/* Step 2: Email OTP */}
          {step === 'emailOtp' && (
            <form onSubmit={handleEmailOtpSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(230, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(230, 0, 0, 0.2)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    OTP sent to: <strong style={{ color: '#e60000' }}>{email}</strong>
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Enter Email OTP"
                  type="text"
                  value={emailOtp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setEmailOtp(value);
                  }}
                  required
                  placeholder="000000"
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                  }}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Check your email for the 6-digit OTP"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleBackToCredentials}
                    disabled={loading}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading || emailOtp.length !== 6}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
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
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleResendEmailOtp}
                    disabled={emailResendTimer > 0 || loading}
                    sx={{
                      color: emailResendTimer > 0 ? 'text.secondary' : '#e60000',
                      textTransform: 'none',
                    }}
                  >
                    {emailResendTimer > 0 ? `Resend OTP in ${emailResendTimer}s` : 'Resend OTP'}
                  </Button>
                </Box>
              </Box>
            </form>
          )}
        </Paper>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 4,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            © VodafoneThree Amdocs Testing Team
          </Typography>
        </Box>
      </Container>

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
    </Box>
  );
}

export default Login;
