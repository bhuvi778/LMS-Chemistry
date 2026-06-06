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

    // Only force logout if the token-verification endpoint (/auth/me) returns 401.
    // This means the token is truly expired or invalid globally.
    // Other 401s (e.g. accessing a restricted resource) should NOT log the user out.
    const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/verify');
    if (status === 401 && isAuthEndpoint && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }

    const msg = err.response?.data?.message || err.message;
    const e = new Error(msg);
    e.response = err.response;
    e.status = status;
    return Promise.reject(e);
  }
);

export default api;
