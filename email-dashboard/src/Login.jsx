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
  Phone as PhoneIcon,
  Lock as LockIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  Input as InputIcon,
} from '@mui/icons-material';

// Mock OTP storage (in production, this would be handled by a backend/SMS service)
let otpStorage = {};

// Mock user credentials (in production, validate against backend/AD/LDAP)
const validateCredentials = async (username, password) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock validation - in production, call your authentication API
  // For demo purposes, accept any non-empty username/password
  if (username && password && username.trim() !== '' && password.trim() !== '') {
    return { valid: true, message: 'Credentials validated successfully' };
  }
  
  return { valid: false, message: 'Invalid username or password' };
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock function to send OTP (in production, integrate with SMS service like Twilio, AWS SNS, etc.)
const sendOTP = async (mobileNumber) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const otp = generateOTP();
  otpStorage[mobileNumber] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // OTP expires in 5 minutes
  };
  
  // In production, send SMS here using a service like:
  // - Twilio
  // - AWS SNS
  // - MessageBird
  // - Your custom SMS gateway
  
  console.log(`OTP for ${mobileNumber}: ${otp}`); // Remove in production
  
  return { success: true, message: 'OTP sent successfully to your mobile number' };
};

// Validate OTP
const validateOTP = (mobileNumber, enteredOTP) => {
  const stored = otpStorage[mobileNumber];
  
  if (!stored) {
    return { valid: false, message: 'OTP not found. Please request a new OTP.' };
  }
  
  if (Date.now() > stored.expiresAt) {
    delete otpStorage[mobileNumber];
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }
  
  if (stored.otp !== enteredOTP) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP is valid, clean up
  delete otpStorage[mobileNumber];
  return { valid: true, message: 'OTP verified successfully' };
};

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials', 'mobile', or 'otp'
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend OTP
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both username and password',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await validateCredentials(username, password);
      if (result.valid) {
        setStep('mobile');
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error',
        });
        setPassword('');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to validate credentials. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number format
    const mobileRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!mobileRegex.test(mobileNumber.replace(/\s/g, ''))) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid mobile number',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(mobileNumber);
      if (result.success) {
        setStep('otp');
        startResendTimer();
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send OTP. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setSnackbar({
        open: true,
        message: 'Please enter a 6-digit OTP',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const result = validateOTP(mobileNumber, otp);
      if (result.valid) {
        // Store authentication in localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('mobileNumber', mobileNumber);
        localStorage.setItem('loginTime', Date.now().toString());
        
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success',
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'error',
        });
        setOtp('');
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

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const result = await sendOTP(mobileNumber);
      if (result.success) {
        startResendTimer();
        setOtp('');
        setSnackbar({
          open: true,
          message: 'OTP resent successfully',
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

  const handleBackToMobile = () => {
    setStep('mobile');
    setOtp('');
    setResendTimer(0);
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setMobileNumber('');
    setOtp('');
    setResendTimer(0);
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
              mt: 2,
              color: 'text.secondary',
            }}
          >
            {step === 'credentials' 
              ? 'Enter your credentials to continue' 
              : step === 'mobile' 
              ? 'Enter your mobile number to receive OTP' 
              : 'Enter the OTP sent to your mobile'}
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
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Enter your username"
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
                  disabled={loading || !username || !password}
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
          ) : step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit}>
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
                    Logged in as: <strong style={{ color: '#e60000' }}>{username}</strong>
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Mobile Number"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  placeholder="+1234567890"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Enter your mobile number with country code"
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
                    disabled={loading || !mobileNumber}
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
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </Box>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit}>
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
                    OTP sent to: <strong style={{ color: '#e60000' }}>{mobileNumber}</strong>
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  required
                  placeholder="000000"
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' },
                  }}
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Enter the 6-digit OTP sent to your mobile number"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleBackToMobile}
                    disabled={loading}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    Change Number
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading || otp.length !== 6}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
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
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                    sx={{
                      color: resendTimer > 0 ? 'text.secondary' : '#e60000',
                      textTransform: 'none',
                    }}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
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

