import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    // Only force logout if the token-verification endpoint (/auth/me) returns 401
    // or if the session has expired / logged out from another device.
    const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/verify');
    const isSessionExpired = err.response?.data?.message?.includes('Session has expired') || 
                            err.response?.data?.message?.includes('logged out from another device');

    if (status === 401 && (isAuthEndpoint || isSessionExpired) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
      
      // Redirect to login with session expired reason if not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=session_expired';
      }
    }

    const msg = err.response?.data?.message || err.message;
    const e = new Error(msg);
    e.response = err.response;
    e.status = status;
    return Promise.reject(e);
  }
);

export default api;
