import crypto from 'crypto';

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE_LEN = BASE62_CHARS.length; // 62

/**
 * Generates a random Base62 string of a given length using crypto.randomInt
 * @param {number} length - Desired string length (default 7)
 * @returns {string} Random Base62 string
 */
export const generateBase62Code = (length = 7) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, BASE_LEN);
    code += BASE62_CHARS[randomIndex];
  }
  return code;
};

/**
 * Generates a Base62 short code and verifies uniqueness against storage.
 * Retries if a collision occurs.
 * @param {function} checkExistsFn - Async function(candidateCode) => boolean
 * @param {number} length - Code length (default 7)
 * @param {number} maxRetries - Maximum retry attempts before error (default 10)
 * @returns {Promise<string>} Unique short code
 */
export const generateUniqueShortCode = async (checkExistsFn, length = 7, maxRetries = 10) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    const candidateCode = generateBase62Code(length);
    const exists = await checkExistsFn(candidateCode);
    if (!exists) {
      return candidateCode;
    }
    attempts++;
    console.warn(`[Base62] Collision detected for code "${candidateCode}". Retrying attempt ${attempts}/${maxRetries}`);
  }
  throw new Error(`Failed to generate a unique short code after ${maxRetries} collision attempts.`);
};
