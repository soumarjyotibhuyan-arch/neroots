import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../pages/_app';

export default function MobileNav() {
  const router = useRouter();
  const { cartCount, setIsCartOpen, isAdmin, user } = useStore();

  const currentPath = router.pathname;

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
      <div className="mobile-bottom-bar-inner">
        <Link
          href="/"
          className={`mobile-nav-tab ${currentPath === '/' ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">🏠</span>
          <span className="mobile-nav-label">Shop</span>
        </Link>

        <Link
          href="/#catalog"
          className={`mobile-nav-tab ${currentPath === '/' && router.asPath.includes('#catalog') ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">🌶️</span>
          <span className="mobile-nav-label">Pickles</span>
        </Link>

        <Link
          href="/team"
          className={`mobile-nav-tab ${currentPath === '/team' ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">👥</span>
          <span className="mobile-nav-label">Team</span>
        </Link>

        <Link
          href="/reviews"
          className={`mobile-nav-tab ${currentPath === '/reviews' ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">⭐</span>
          <span className="mobile-nav-label">Reviews</span>
        </Link>

        {isAdmin ? (
          <Link
            href="/admin"
            className={`mobile-nav-tab ${currentPath === '/admin' ? 'active' : ''}`}
            style={{ color: 'var(--primary)' }}
          >
            <span className="mobile-nav-icon">⚙️</span>
            <span className="mobile-nav-label" style={{ fontWeight: 700 }}>Admin</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="mobile-nav-tab mobile-cart-btn"
            aria-label={`Open Cart (${cartCount} items)`}
          >
            <div className="mobile-cart-icon-wrapper">
              <span className="mobile-nav-icon">🛒</span>
              {cartCount > 0 && (
                <span className="mobile-cart-badge">{cartCount}</span>
              )}
            </div>
            <span className="mobile-nav-label">Cart</span>
          </button>
        )}
      </div>
    </nav>
  );
}
