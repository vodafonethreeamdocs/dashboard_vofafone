// Admin Stats Panel - Only visible to admin users
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Login as LoginIcon,
  Email as EmailIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { getAllAuditLogs, getEmailCountByUser, AUDIT_ACTIONS } from './auditService';

function AdminStatsPanel() {
  const [logs, setLogs] = useState([]);
  const [emailCounts, setEmailCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState({
    totalLogins: 0,
    totalEmails: 0,
    failedLogins: 0,
    todayLogins: 0,
    todayEmails: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, countsData] = await Promise.all([
        getAllAuditLogs(200),
        getEmailCountByUser(),
      ]);
      setLogs(logsData);
      setEmailCounts(countsData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const newStats = {
        totalLogins: logsData.filter(l => l.action === AUDIT_ACTIONS.LOGIN_SUCCESS).length,
        totalEmails: logsData.filter(l => l.action === AUDIT_ACTIONS.SEND_EMAIL).length,
        failedLogins: logsData.filter(l => l.action === AUDIT_ACTIONS.LOGIN_FAILED).length,
        todayLogins: logsData.filter(l => l.action === AUDIT_ACTIONS.LOGIN_SUCCESS && l.date === today).length,
        todayEmails: logsData.filter(l => l.action === AUDIT_ACTIONS.SEND_EMAIL && l.date === today).length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'User Email', 'Action', 'Details'];
    const csvData = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.userEmail,
      log.action,
      JSON.stringify(log.details),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get recent activity (last 10)
  const recentActivity = logs.slice(0, 10);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mt: 3,
        backgroundColor: 'rgba(26, 26, 33, 0.95)',
        border: '1px solid rgba(230, 0, 0, 0.2)',
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#e60000',
          }}
        >
          📊 Admin Stats
          <Chip
            label="Admin Only"
            size="small"
            sx={{ 
              ml: 1, 
              backgroundColor: 'rgba(230, 0, 0, 0.2)',
              color: '#ff6666',
              fontSize: '0.7rem',
            }}
          />
        </Typography>
        <IconButton size="small" sx={{ color: '#e60000' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} sx={{ color: '#e60000' }} />
          </Box>
        ) : (
          <>
            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Box sx={{ 
                flex: 1, 
                minWidth: 120,
                p: 2, 
                backgroundColor: 'rgba(0, 200, 83, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(0, 200, 83, 0.2)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LoginIcon sx={{ color: '#00c853', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#00c853' }}>Total Logins</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{stats.totalLogins}</Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>Today: {stats.todayLogins}</Typography>
              </Box>

              <Box sx={{ 
                flex: 1, 
                minWidth: 120,
                p: 2, 
                backgroundColor: 'rgba(33, 150, 243, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(33, 150, 243, 0.2)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon sx={{ color: '#2196f3', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#2196f3' }}>Emails Sent</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{stats.totalEmails}</Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>Today: {stats.todayEmails}</Typography>
              </Box>

              <Box sx={{ 
                flex: 1, 
                minWidth: 120,
                p: 2, 
                backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.2)',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ErrorIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#ff9800' }}>Failed Logins</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>{stats.failedLogins}</Typography>
              </Box>
            </Box>

            {/* Emails Per User */}
            {Object.keys(emailCounts).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#a0a0a0' }}>
                  📧 Emails Per User:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(emailCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([email, count]) => (
                    <Chip
                      key={email}
                      label={`${email.split('@')[0]}: ${count}`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        '& .MuiChip-label': { fontSize: '0.75rem' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Recent Activity */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#a0a0a0' }}>
                🕐 Recent Activity:
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {recentActivity.map((log, index) => (
                  <Box
                    key={log.id || index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#606060', minWidth: 100 }}>
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                    <Chip
                      label={log.action?.replace('_', ' ')}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        height: 20,
                        backgroundColor: log.action?.includes('SUCCESS') || log.action === 'SEND_EMAIL'
                          ? 'rgba(0, 200, 83, 0.2)'
                          : log.action?.includes('FAILED')
                          ? 'rgba(244, 67, 54, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: log.action?.includes('SUCCESS') || log.action === 'SEND_EMAIL'
                          ? '#00c853'
                          : log.action?.includes('FAILED')
                          ? '#f44336'
                          : '#a0a0a0',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {log.userEmail?.split('@')[0] || 'unknown'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                sx={{ borderColor: 'rgba(230, 0, 0, 0.3)', color: '#e60000' }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                disabled={logs.length === 0}
                sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: '#a0a0a0' }}
              >
                Export CSV
              </Button>
            </Box>
          </>
        )}
      </Collapse>
    </Paper>
  );
}

export default AdminStatsPanel;

