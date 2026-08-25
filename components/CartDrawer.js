import React from 'react';
import Link from 'next/link';
import { useStore } from '../pages/_app';
import GoogleSignInBtn from './GoogleSignInBtn';

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    user
  } = useStore();

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-drag-handle"></div>

        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/images/ner_logo_icon.jpg"
              alt="NE Roots Icon"
              style={{ width: 28, height: 28, borderRadius: 6 }}
            />
            <div>
              <h3 style={{ fontSize: 18, margin: 0 }}>Your Pickle Basket</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {cartCount} item(s) selected
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'none',
              fontSize: 24,
              color: 'var(--text-muted)',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close basket"
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '12px 24px', background: '#fff9e6', borderBottom: '1px solid #ffd147', fontSize: 12 }}>
          {cartSubtotal >= 599 ? (
            <span style={{ color: '#008738', fontWeight: 700 }}>
              🎉 You have qualified for FREE Express Delivery!
            </span>
          ) : (
            <span>
              Add <strong>₹{599 - cartSubtotal}</strong> more for <strong>FREE Delivery</strong> across India!
            </span>
          )}
          <div style={{ width: '100%', height: 6, background: '#ebdcd0', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (cartSubtotal / 599) * 100)}%`,
                height: '100%',
                background: 'var(--primary)',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
              <h4>Your basket is empty</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Add some authentic North Eastern pickles to get started!
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                style={{
                  marginTop: 16,
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Browse Flavours
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartItemId} className="cart-item">
                <img
                  src={item.image || '/images/mango_pickle.jpg'}
                  alt={item.name}
                  className="cart-item-img"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                    Size: <strong>{item.weight}</strong> | ₹{item.price} each
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 8, background: '#fdfaf6' }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        style={{
                          padding: '6px 12px',
                          background: 'none',
                          fontWeight: 800,
                          fontSize: 16,
                          minWidth: 36,
                          minHeight: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span style={{ padding: '0 8px', fontSize: 14, fontWeight: 700 }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        style={{
                          padding: '6px 12px',
                          background: 'none',
                          fontWeight: 800,
                          fontSize: 16,
                          minWidth: 36,
                          minHeight: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <strong style={{ color: 'var(--primary-dark)', fontSize: 15 }}>
                      ₹{item.price * item.quantity}
                    </strong>

                    <button
                      type="button"
                      onClick={() => removeFromCart ? removeFromCart(item.cartItemId) : updateQuantity(item.cartItemId, -item.quantity)}
                      style={{
                        background: 'none',
                        color: '#b91c1c',
                        fontSize: 14,
                        minWidth: 36,
                        minHeight: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      aria-label="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer & Checkout CTA */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Items Total (GST Included):</span>
              <strong>₹{cartSubtotal}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Charge:</span>
              <span>
                {cartSubtotal >= 599 ? (
                  <strong style={{ color: '#008738' }}>FREE</strong>
                ) : (
                  '₹49'
                )}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
              <span>Final Amount:</span>
              <span style={{ color: 'var(--primary-dark)' }}>
                ₹{cartSubtotal >= 599 ? cartSubtotal : cartSubtotal + 49}
              </span>
            </div>

            {/* Google Identity User Status in Cart */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                <img src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'} alt={user.name} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                <span style={{ color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ✓ Signed in as {user.name}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '6px 10px', borderRadius: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>⚡ 1-Click Google Fill</span>
                <GoogleSignInBtn size="small" label="Sign in" />
              </div>
            )}

            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="checkout-btn"
            >
              Proceed to Secure Checkout →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
