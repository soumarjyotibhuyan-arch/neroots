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

  const isSuperAdmin = adminRole === 'super_admin' || user.email === 'utpalabhuyan29@gmail.com';
  const roleDisplay = isSuperAdmin
    ? 'Super Admin (Owner)'
    : isAdmin
    ? 'Store Administrator'
    : 'Verified Customer';

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
          border: isAdmin ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease'
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
          {isAdmin ? (
            <span style={{ fontSize: 10, color: isSuperAdmin ? '#b91c1c' : '#1d4ed8', fontWeight: 800, marginTop: -2 }}>
              {isSuperAdmin ? '👑 Super Admin' : '⚡ Admin'}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: '#166534', fontWeight: 700, marginTop: -2 }}>
              ✓ Customer
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
            width: 260,
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            padding: 14,
            zIndex: 100,
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ paddingBottom: 10, borderBottom: '1px solid var(--border-color)', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-dark)' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</div>
            
            <div style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: isSuperAdmin ? '#fef2f2' : isAdmin ? '#eff6ff' : '#f0fdf4',
              color: isSuperAdmin ? '#991b1b' : isAdmin ? '#1e40af' : '#166534',
              border: `1px solid ${isSuperAdmin ? '#fecaca' : isAdmin ? '#bfdbfe' : '#bbf7d0'}`,
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6
            }}>
              {isSuperAdmin ? '👑 Verified Owner / Super Admin' : isAdmin ? '⚡ Verified Store Administrator' : '✓ Verified Google Customer'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#ffffff',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(217, 37, 37, 0.25)'
                }}
              >
                <span>⚙️</span> Open Admin Dashboard
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
              <span>⭐</span> Verified Customer Reviews
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
