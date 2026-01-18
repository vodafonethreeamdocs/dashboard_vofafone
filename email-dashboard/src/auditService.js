// Audit Service for VodafoneThree Dashboard
// Logs user actions to Firestore for monitoring and compliance

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  limit
} from 'firebase/firestore';

// Collection name for audit logs
const AUDIT_COLLECTION = 'audit_logs';

/**
 * Log an action to the audit trail
 * @param {string} userEmail - Email of the user performing the action
 * @param {string} action - Type of action (LOGIN_SUCCESS, LOGIN_FAILED, SEND_EMAIL, etc.)
 * @param {object} details - Additional details about the action
 * @returns {Promise<string>} - Document ID of the created log
 */
export const logAuditEvent = async (userEmail, action, details = {}) => {
  try {
    const auditEntry = {
      userEmail: userEmail || 'unknown',
      action,
      details,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent,
      // Get readable date for easier querying
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    const docRef = await addDoc(collection(db, AUDIT_COLLECTION), auditEntry);
    console.log('Audit log created:', docRef.id);
    return docRef.id;
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
 * Get audit logs for a specific user
 * @param {string} userEmail - Email of the user
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getAuditLogsByUser = async (userEmail, limitCount = 50) => {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where('userEmail', '==', userEmail),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Get all audit logs (for admin view)
 * @param {number} limitCount - Maximum number of logs to retrieve
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getAllAuditLogs = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching all audit logs:', error);
    return [];
  }
};

/**
 * Get email count per user (for statistics)
 * @returns {Promise<Object>} - Object with email counts per user
 */
export const getEmailCountByUser = async () => {
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where('action', '==', AUDIT_ACTIONS.SEND_EMAIL)
    );
    
    const querySnapshot = await getDocs(q);
    const counts = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.userEmail;
      counts[email] = (counts[email] || 0) + 1;
    });
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
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      limit(500)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs by date:', error);
    return [];
  }
};

