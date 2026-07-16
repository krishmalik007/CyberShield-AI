import axios from 'axios';

// Use environment variable or default to local backend
const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    return response.json();
};

export const signup = async (username, email, password) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Signup failed');
    }
    return response.json();
};

export const fetchSummary = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats/summary`, { headers: getAuthHeaders() });
  return response.data;
};

export const fetchTrends = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats/trends`, { headers: getAuthHeaders() });
  return response.data;
};

export const fetchRecentAlerts = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats/recent`, { headers: getAuthHeaders() });
  return response.data;
};

export const fetchExtensionStatus = () => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', messageListener);
      resolve(false);
    }, 1000); // 1 second timeout for response

    const messageListener = (event) => {
      if (event.data && event.data.type === 'EXTENSION_STATUS_REPLY') {
        clearTimeout(timeout);
        window.removeEventListener('message', messageListener);
        resolve(true);
      }
    };

    window.addEventListener('message', messageListener);
    window.postMessage({ type: 'CHECK_EXTENSION_STATUS' }, '*');
  });
};

export const fetchUrlHistory = async (classification = null) => {
  const url = classification 
    ? `${API_BASE_URL}/history?classification=${classification}` 
    : `${API_BASE_URL}/history`;
  const response = await axios.get(url, { headers: getAuthHeaders() });
  return response.data;
};

export const fetchEmailHistory = async () => {
  const response = await axios.get(`${API_BASE_URL}/email-history`, { headers: getAuthHeaders() });
  return response.data;
};
