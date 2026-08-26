import React, { useState, useEffect, useRef } from 'react';
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
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const isConfigured = clientId && !clientId.includes('example') && !clientId.startsWith('1234567890');

  useEffect(() => {
    if (user || typeof window === 'undefined') return;

    // Load Google Identity Services SDK if not yet loaded
    const initGIS = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return;

      try {
        const effectiveClientId = isConfigured ? clientId : '1234567890-example.apps.googleusercontent.com';

        window.google.accounts.id.initialize({
          client_id: effectiveClientId,
          callback: async (response) => {
            if (response && response.credential) {
              const res = await loginWithGoogle(response.credential);
              if (res && res.success && onSuccess) {
                onSuccess(res.user);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 600;
        window.google.accounts.id.renderButton(btnRef.current, {
          theme,
          size: isMobileScreen ? 'small' : size,
          text,
          shape,
          width: width || (isMobileScreen ? 120 : (size === 'large' ? 240 : 160))
        });
      } catch (err) {
        console.warn('GIS Button render note:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGIS();
        }
      }, 300);
      return () => clearInterval(checkInterval);
    }
  }, [user, theme, size, text, shape, width, isConfigured, clientId]);

  if (isAuthLoading) {
    return (
      <div style={{ height: 38, width: 140, background: '#f3f4f6', borderRadius: 20, animation: 'pulse 1.5s infinite' }}></div>
    );
  }

  if (user) {
    return null;
  }

  // Handle custom button click to trigger Google OAuth popup
  const handleCustomGoogleClick = () => {
    if (typeof window === 'undefined') return;

    if (!isConfigured) {
      setShowConfigHelp(true);
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap prompt was skipped, initiate standard OAuth2 token flow
          if (window.google?.accounts?.oauth2) {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                  try {
                    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                    });
                    const profile = await userInfoRes.json();
                    if (profile && profile.email) {
                      const res = await loginWithGoogle(profile);
                      if (res.success && onSuccess) onSuccess(res.user);
                    }
                  } catch (e) {
                    console.error('Failed to fetch Google profile:', e);
                  }
                }
              }
            });
            tokenClient.requestAccessToken();
          }
        }
      });
    }
  };

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Render container for Official Google Identity Services SDK button */}
        <div ref={btnRef} onClick={handleCustomGoogleClick} style={{ cursor: 'pointer' }}>
          {/* Fallback button shown before iframe loads */}
          <button
            type="button"
            onClick={handleCustomGoogleClick}
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

      {/* Google Cloud Console Setup Helper Modal (shown if Client ID is missing) */}
      {showConfigHelp && (
        <div
          className="cart-drawer-overlay"
          onClick={() => setShowConfigHelp(false)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: '30px 26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setShowConfigHelp(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 16,
                color: '#6b7280'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <svg width="28" height="28" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>
                Google Sign-In Configuration
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
              To enable official Google OAuth popup verification, configure your <strong>Google OAuth Client ID</strong> from the Google Cloud Console:
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, fontSize: 12.5, lineHeight: 1.6, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>3-Step Setup:</div>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                <li>Go to <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>.</li>
                <li>Create an <strong>OAuth 2.0 Web Client ID</strong> with Authorized Origin: <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4 }}>https://neroots.vercel.app</code></li>
                <li>Add <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4 }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your Vercel project environment variables.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowConfigHelp(false)}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
