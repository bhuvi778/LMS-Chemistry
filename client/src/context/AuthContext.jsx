import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  // 2FA pending state: { tempToken, email }
  const [pending2FA, setPending2FA] = useState(null);
  // Email verification pending state: { tempToken, email }
  const [pendingVerification, setPendingVerification] = useState(null);
  // OTP-Only Login pending state: { tempToken, email }
  const [pendingOtpLogin, setPendingOtpLogin] = useState(null);

  // Persist user
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // Listen for forced logout from api interceptor (401)
  useEffect(() => {
    const onLogout = () => { setUser(null); setPending2FA(null); setPendingVerification(null); setPendingOtpLogin(null); };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // On mount: verify token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setBootstrapping(false); return; }
    api
      .get('/auth/me')
      .then(({ data }) => setUser((prev) => ({ ...(prev || {}), ...data })))
      .catch(() => {})
      .finally(() => setBootstrapping(false));
  }, []);

  /** Step 1 of login. Returns the user data OR sets pending2FA/pendingVerification state. */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.requiresVerification) {
        setPendingVerification({ tempToken: data.tempToken, email: data.email });
        return { requiresVerification: true };
      }
      if (data.requires2FA) {
        // Store temp token; do NOT set user yet
        setPending2FA({ tempToken: data.tempToken, email: data.email });
        return { requires2FA: true };
      }
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: verify OTP using the tempToken */
  const verifyOtp = async (code) => {
    if (!pending2FA) throw new Error('No pending 2FA session');
    setLoading(true);
    try {
      // Temporarily set the Authorization header to the tempToken
      const { data } = await api.post(
        '/auth/verify-otp',
        { code },
        { headers: { Authorization: `Bearer ${pending2FA.tempToken}` } }
      );
      setPending2FA(null);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  /** Cancel OTP step */
  const cancelOtp = () => setPending2FA(null);

  const loginWithGoogle = async (credential, referralCode) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential, referralCode });
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      if (data.requiresVerification) {
        setPendingVerification({ tempToken: data.tempToken, email: data.email });
        return { requiresVerification: true };
      }
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (code) => {
    if (!pendingVerification) throw new Error('No pending email verification session');
    setLoading(true);
    try {
      const { data } = await api.post(
        '/auth/verify-email',
        { code },
        { headers: { Authorization: `Bearer ${pendingVerification.tempToken}` } }
      );
      setPendingVerification(null);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const cancelVerification = () => setPendingVerification(null);

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    setUser((prev) => ({ ...(prev || {}), ...data }));
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('token');
    setUser(null);
    setPending2FA(null);
    setPendingVerification(null);
    setPendingOtpLogin(null);
  };

  const requestOtpLogin = async (email) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login-otp-request', { email });
      setPendingOtpLogin({ tempToken: data.tempToken, email: data.email });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpLogin = async (code) => {
    if (!pendingOtpLogin) throw new Error('No pending OTP login session');
    setLoading(true);
    try {
      const { data } = await api.post(
        '/auth/login-otp-verify',
        { code },
        { headers: { Authorization: `Bearer ${pendingOtpLogin.tempToken}` } }
      );
      setPendingOtpLogin(null);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const cancelOtpLogin = () => setPendingOtpLogin(null);

  return (
    <AuthContext.Provider
      value={{
        user, loading, bootstrapping,
        pending2FA, pendingVerification, pendingOtpLogin,
        login, verifyOtp, cancelOtp, loginWithGoogle,
        register, verifyEmail, cancelVerification,
        forgotPassword, resetPassword,
        requestOtpLogin, verifyOtpLogin, cancelOtpLogin,
        logout, setUser, updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

