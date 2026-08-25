import React, { useEffect, useRef } from 'react';
import { useStore } from '../pages/_app';

export default function GoogleSignInBtn({
  theme = 'outline',
  size = 'medium',
  text = 'signin_with',
  shape = 'pill',
  width = null,
  label = 'Sign in with Google',
  onSuccess = null
}) {
  const btnRef = useRef(null);
  const { user, loginWithGoogle, isAuthLoading } = useStore();

  useEffect(() => {
    if (!user && typeof window !== 'undefined' && window.google?.accounts?.id && btnRef.current) {
      try {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-example.apps.googleusercontent.com';

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              const res = await loginWithGoogle(response.credential);
              if (res.success && onSuccess) onSuccess(res.user);
            }
          },
          auto_select: false
        });

        window.google.accounts.id.renderButton(btnRef.current, {
          theme,
          size,
          text,
          shape,
          width: width || (size === 'large' ? 280 : 200)
        });
      } catch (err) {
        console.warn('GIS Button render note:', err);
      }
    }
  }, [user, theme, size, text, shape, width]);

  if (isAuthLoading) {
    return (
      <div style={{ height: 38, width: 140, background: '#f3f4f6', borderRadius: 20, animation: 'pulse 1.5s infinite' }}></div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Container for official Google Identity Services iframe */}
      <div ref={btnRef}>
        {/* Accessible fallback button if GIS is loading or blocked by adblockers */}
        <button
          type="button"
          onClick={() => {
            const emailPrompt = prompt('Enter your Google Account email to sign in:');
            if (emailPrompt && emailPrompt.trim()) {
              loginWithGoogle(emailPrompt.trim());
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#ffffff',
            color: '#3c4043',
            border: '1px solid #dadce0',
            borderRadius: 'var(--radius-full)',
            padding: size === 'large' ? '10px 20px' : '7px 14px',
            fontSize: size === 'large' ? 14 : 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
            transition: 'background 0.2s, box-shadow 0.2s'
          }}
          aria-label={label}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}
