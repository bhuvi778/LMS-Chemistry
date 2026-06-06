/**
 * /impersonate  — Admin "Login as Student" landing page.
 * The admin portal stores impersonation data in sessionStorage under
 * 'impersonate_payload', then opens this page. We pick it up, set the
 * real token + user in localStorage, and redirect to the dashboard.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Impersonate() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('impersonate_payload');
      if (!raw) {
        navigate('/login', { replace: true });
        return;
      }
      const { token, student } = JSON.parse(raw);
      sessionStorage.removeItem('impersonate_payload');

      // Set auth exactly as the normal login flow does
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...student, token }));

      // Reload so AuthContext picks up the new token/user from localStorage
      window.location.href = '/dashboard';
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
      <Loader2 size={36} className="animate-spin text-brand-600" />
      <p className="text-sm">Switching to student account…</p>
    </div>
  );
}
