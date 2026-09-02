import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10s timeout
});

/**
 * Shorten a long URL
 * @param {string} originalUrl
 */
export const shortenUrl = async (originalUrl) => {
  try {
    const response = await api.post('/api/shorten', { originalUrl });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const errData = error.response.data;
      // Handle Vite proxy connection errors (which return error as an object)
      if (errData.error && typeof errData.error === 'object' && errData.error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to backend. Please ensure the backend server is running.');
      }
      
      const errMsg = errData.error || errData.message || 'Failed to shorten URL.';
      throw new Error(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
    }
    throw new Error('Network error. Unable to reach backend server.');
  }
};

/**
 * Fetch click analytics for a short code
 * @param {string} code
 */
export const getStats = async (code) => {
  try {
    const response = await api.get(`/api/stats/${code}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to fetch link statistics.');
    }
    throw new Error('Network error. Unable to reach backend server.');
  }
};

/**
 * Fetch all shortened links with optional sorting
 * @param {string} sort - 'newest' | 'clicks' | 'oldest'
 */
export const getAllUrls = async (sort = 'newest') => {
  try {
    const response = await api.get(`/api/urls?sort=${sort}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to load URL list.');
    }
    throw new Error('Network error. Unable to reach backend server.');
  }
};
