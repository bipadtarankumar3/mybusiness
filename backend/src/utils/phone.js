'use strict';

/**
 * Normalizes phone numbers to E.164 format (defaults 10-digit Indian mobile numbers to +91).
 */
function normalizePhone(input) {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

function isValidPhone(phone) {
  return /^\+\d{8,15}$/.test(phone);
}

module.exports = { normalizePhone, isValidPhone };
