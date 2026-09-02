/**
 * Utility for URL validation and anomaly/malicious link detection
 */

// Suspicious patterns / phishing / localhost loop indicators
const SUSPICIOUS_PATTERNS = [
  /^(http|https):\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, // Raw IP addresses
  /phish|account-update|login-verify|bank-secure|update-wallet/i, // Obvious phishing keywords
  /\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i // High-risk free TLDs often abused
];

/**
 * Validates and checks a target URL for anomalies or malicious indicators
 * @param {string} urlString - Input URL
 * @param {string} baseUrl - Base URL of the shortener application
 * @returns {object} { isValid: boolean, isFlagged: boolean, reason?: string }
 */
export const validateUrl = (urlString, baseUrl = process.env.BASE_URL || 'http://localhost:5001') => {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, isFlagged: false, reason: 'URL is required.' };
  }

  const trimmedUrl = urlString.trim();

  // 1. Format check
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch (err) {
    return { isValid: false, isFlagged: false, reason: 'Invalid URL format. Must include protocol (e.g. http:// or https://).' };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, isFlagged: false, reason: 'Only http:// and https:// URLs are supported.' };
  }

  // 2. Prevent self-referencing redirect loops
  try {
    const baseParsed = new URL(baseUrl);
    if (parsedUrl.host === baseParsed.host) {
      return { isValid: false, isFlagged: false, reason: 'Cannot shorten links originating from this shortener domain.' };
    }
  } catch (err) {
    // If baseUrl fails to parse, fallback check
    if (trimmedUrl.includes(baseUrl)) {
      return { isValid: false, isFlagged: false, reason: 'Cannot shorten self-referencing URLs.' };
    }
  }

  // 3. Anomaly / Malicious detection
  let isFlagged = false;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedUrl)) {
      isFlagged = true;
      break;
    }
  }

  return {
    isValid: true,
    isFlagged,
    cleanUrl: trimmedUrl
  };
};
