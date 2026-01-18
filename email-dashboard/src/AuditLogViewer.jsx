// Audit Log Viewer Component
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { getAllAuditLogs, getEmailCountByUser } from './auditService';

// Action type colors and labels
const ACTION_CONFIG = {
  LOGIN_SUCCESS: { color: 'success', label: 'Login Success' },
  LOGIN_FAILED: { color: 'error', label: 'Login Failed' },
  OTP_SENT: { color: 'info', label: 'OTP Sent' },
  OTP_VERIFIED: { color: 'success', label: 'OTP Verified' },
  OTP_FAILED: { color: 'warning', label: 'OTP Failed' },
  LOGOUT: { color: 'default', label: 'Logout' },
  SEND_EMAIL: { color: 'primary', label: 'Email Sent' },
  SEND_EMAIL_FAILED: { color: 'error', label: 'Email Failed' },
};

function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [emailCounts, setEmailCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [logsData, countsData] = await Promise.all([
        getAllAuditLogs(100),
        getEmailCountByUser(),
      ]);
      setLogs(logsData);
      setEmailCounts(countsData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details)?.toLowerCase().includes(searchLower)
    );
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'User Email', 'Action', 'Details'];
    const csvData = filteredLogs.map((log) => [
      formatTimestamp(log.timestamp),
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

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mt: 3,
        backgroundColor: 'rgba(26, 26, 33, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
          }}
        >
          📊 Audit Log
          <Chip
            label={`${logs.length} records`}
            size="small"
            sx={{ ml: 1, backgroundColor: 'rgba(230, 0, 0, 0.2)' }}
          />
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        {/* Email Counts Summary */}
        {Object.keys(emailCounts).length > 0 && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(0, 200, 83, 0.1)', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#00c853' }}>
              📧 Emails Sent Per User:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(emailCounts).map(([email, count]) => (
                <Chip
                  key={email}
                  label={`${email}: ${count}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiChip-label': { fontSize: '0.75rem' },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
          >
            Export CSV
          </Button>
        </Box>

        {/* Logs Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Typography
            sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
          >
            No audit logs found
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#1a1a21', fontWeight: 600 }}>
                    Timestamp
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#1a1a21', fontWeight: 600 }}>
                    User
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#1a1a21', fontWeight: 600 }}>
                    Action
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#1a1a21', fontWeight: 600 }}>
                    Details
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(230, 0, 0, 0.05)' },
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {log.userEmail || 'unknown'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ACTION_CONFIG[log.action]?.label || log.action}
                        color={ACTION_CONFIG[log.action]?.color || 'default'}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 300 }}>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(log.details).slice(0, 3).map(([key, value]) => (
                            <Chip
                              key={key}
                              label={`${key}: ${value}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Paper>
  );
}

export default AuditLogViewer;

