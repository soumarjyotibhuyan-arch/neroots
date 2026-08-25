import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '../pages/_app';
import GoogleSignInBtn from './GoogleSignInBtn';

export default function UserMenu() {
  const { user, isAdmin, adminRole, logoutGoogle } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return <GoogleSignInBtn size="medium" label="Sign in" />;
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#ffffff',
          padding: '4px 12px 4px 6px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}
        aria-label="User account menu"
      >
        <img
          src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
          alt={user.name}
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </span>
          {isAdmin && (
            <span style={{ fontSize: 10, color: '#008738', fontWeight: 700, marginTop: -2 }}>
              ✓ Admin
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 240,
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            padding: 12,
            zIndex: 100,
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</div>
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e6f4ea', color: '#137333', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
              ✓ Google Verified Customer
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>⚙️</span> Store Admin Portal ({adminRole || 'Admin'})
              </Link>
            )}

            <Link
              href="/checkout"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>🧺</span> View Pickle Basket
            </Link>

            <Link
              href="/reviews"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>⭐</span> Write a Verified Review
            </Link>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logoutGoogle();
              }}
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#b91c1c',
                background: '#fee2e2',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>🔒</span> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
