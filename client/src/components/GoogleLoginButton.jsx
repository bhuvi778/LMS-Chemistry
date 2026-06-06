import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function GoogleLoginButton({ referralCode = '', onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const divRef = useRef(null);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      
      window.google.accounts.id.initialize({
        client_id: '731893542358-lt0ardf07akolsj7k6v8ebr3idsg94sf.apps.googleusercontent.com',
        callback: async (response) => {
          try {
            const user = await loginWithGoogle(response.credential, referralCode);
            toast.success(`Welcome back, ${user.name}!`);
            if (onSuccess) onSuccess(user);
          } catch (err) {
            toast.error(err.message || 'Google authentication failed');
          }
        }
      });

      window.google.accounts.id.renderButton(
        divRef.current,
        { theme: 'outline', size: 'large', width: '100%', shape: 'rectangular' }
      );
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [referralCode, loginWithGoogle, onSuccess]);

  return <div ref={divRef} className="w-full flex justify-center" />;
}
