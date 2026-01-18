// Audit Service for VodafoneThree Dashboard
// Logs user actions to Firebase Realtime Database for monitoring and compliance

import { db } from './firebase';
import { 
  ref, 
  push, 
  get
} from 'firebase/database';

// Path for audit logs in Realtime Database
const AUDIT_PATH = 'audit_logs';

/**
 * Log an action to the audit trail
 * @param {string} userEmail - Email of the user performing the action
 * @param {string} action - Type of action (LOGIN_SUCCESS, LOGIN_FAILED, SEND_EMAIL, etc.)
 * @param {object} details - Additional details about the action
 * @returns {Promise<string>} - Key of the created log
 */
export const logAuditEvent = async (userEmail, action, details = {}) => {
  try {
    const auditEntry = {
      userEmail: userEmail || 'unknown',
      action,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      // Get readable date for easier querying
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    const auditRef = ref(db, AUDIT_PATH);
    const newLogRef = await push(auditRef, auditEntry);
    console.log('Audit log created:', newLogRef.key);
    return newLogRef.key;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
};

// Predefined action types
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  OTP_SENT: 'OTP_SENT',
  OTP_VERIFIED: 'OTP_VERIFIED',
  OTP_FAILED: 'OTP_FAILED',
  LOGOUT: 'LOGOUT',
  SEND_EMAIL: 'SEND_EMAIL',
  SEND_EMAIL_FAILED: 'SEND_EMAIL_FAILED',
};

/**
 * Get all audit logs (for admin view)
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getAllAuditLogs = async (limitCount = 100) => {
  try {
    const auditRef = ref(db, AUDIT_PATH);
    // Simple get without orderByChild to avoid needing index
    const snapshot = await get(auditRef);
    const logs = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        logs.push({ 
          id: childSnapshot.key, 
          ...childSnapshot.val() 
        });
      });
    }
    
    // Sort by timestamp descending (most recent first) and limit
    return logs
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching all audit logs:', error);
    return [];
  }
};

/**
 * Get audit logs for a specific user
 * @param {string} userEmail - Email of the user
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getAuditLogsByUser = async (userEmail, limitCount = 50) => {
  try {
    const auditRef = ref(db, AUDIT_PATH);
    // Simple get and filter in JS to avoid needing index
    const snapshot = await get(auditRef);
    const logs = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.userEmail === userEmail) {
          logs.push({ 
            id: childSnapshot.key, 
            ...data 
          });
        }
      });
    }
    
    // Sort by timestamp descending and limit
    return logs
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Get email count per user (for statistics)
 * @returns {Promise<Object>} - Object with email counts per user
 */
export const getEmailCountByUser = async () => {
  try {
    const auditRef = ref(db, AUDIT_PATH);
    const snapshot = await get(auditRef);
    const counts = {};
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.action === AUDIT_ACTIONS.SEND_EMAIL) {
          const email = data.userEmail;
          counts[email] = (counts[email] || 0) + 1;
        }
      });
    }
    
    return counts;
  } catch (error) {
    console.error('Error getting email counts:', error);
    return {};
  }
};

/**
 * Get audit logs for a specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getAuditLogsByDateRange = async (startDate, endDate) => {
  try {
    const auditRef = ref(db, AUDIT_PATH);
    const snapshot = await get(auditRef);
    const logs = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.date >= startDate && data.date <= endDate) {
          logs.push({ 
            id: childSnapshot.key, 
            ...data 
          });
        }
      });
    }
    
    // Sort by timestamp descending
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching audit logs by date:', error);
    return [];
  }
};
