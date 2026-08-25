import React from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../pages/_app';

export default function StickyCartBar() {
  const router = useRouter();
  const { cart, cartCount, cartSubtotal, setIsCartOpen } = useStore();

  // Only display on storefront pages (home, team, reviews), not on checkout or admin
  const isExcludedPage = router.pathname === '/checkout' || router.pathname === '/admin';
  
  if (isExcludedPage || cartCount === 0) {
    return null;
  }

  return (
    <aside className="sticky-mobile-cart-bar" aria-label="Quick Checkout Bar">
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="sticky-cart-btn"
        aria-label={`View Basket (${cartCount} items, ₹${cartSubtotal})`}
      >
        <div className="sticky-cart-info">
          <span className="sticky-cart-count-pill">{cartCount}</span>
          <div className="sticky-cart-text">
            <span className="sticky-cart-title">Basket Total</span>
            <span className="sticky-cart-price">₹{cartSubtotal}</span>
          </div>
        </div>

        <div className="sticky-cart-action">
          <span>View Basket</span>
          <span className="sticky-cart-arrow">→</span>
        </div>
      </button>
    </aside>
  );
}
