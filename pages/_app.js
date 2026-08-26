import '../styles/globals.css';
import Head from 'next/head';
import { createContext, useContext, useState, useEffect } from 'react';
import MobileNav from '../components/MobileNav';
import CartDrawer from '../components/CartDrawer';
import StickyCartBar from '../components/StickyCartBar';

export const StoreContext = createContext();

export function useStore() {
  return useContext(StoreContext);
}

export default function App({ Component, pageProps }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Google Customer & Admin Authentication State
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check saved session cookie / auth state on mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const res = await fetch('/api/auth/google');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated && data.user) {
            setUser(data.user);
            setIsAdmin(data.isAdmin);
            setAdminRole(data.adminRole);
          }
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuthSession();
  }, []);

  // Initialize Google Identity Services One Tap for returning shoppers
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const isRealClientId = clientId && !clientId.includes('example') && !clientId.startsWith('1234567890');

    if (isRealClientId && !user && typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              await loginWithGoogle(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Trigger Google One Tap UI prompt
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Handled gracefully without blocking
          }
        });
      } catch (err) {
        console.warn('Google One Tap init note:', err.message);
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pickle_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  // Prevent background scroll on iOS and Android when cart drawer or modal is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isCartOpen]);

  const saveCartToStorage = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem('pickle_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  };

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const loginWithGoogle = async (credentialOrPayload) => {
    try {
      const payload = typeof credentialOrPayload === 'string'
        ? { credential: credentialOrPayload }
        : credentialOrPayload;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setIsAdmin(data.isAdmin);
        setAdminRole(data.adminRole);
        showToast(`🎉 Signed in with Google as ${data.user.name}!`);
        return { success: true, user: data.user, isAdmin: data.isAdmin };
      } else {
        showToast(`⚠️ ${data.error || 'Google login failed'}`);
        return { success: false, error: data.error };
      }
    } catch (e) {
      console.error('Google Sign In Error:', e);
      showToast('❌ Failed to connect to Google authentication.');
      return { success: false, error: e.message };
    }
  };

  const logoutGoogle = async () => {
    try {
      await fetch('/api/auth/google', { method: 'DELETE' });
    } catch (e) {}
    setUser(null);
    setIsAdmin(false);
    setAdminRole(null);
    showToast('👋 You have signed out from Google.');
  };

  const addToCart = (product, weight = '250g') => {
    const itemPrice = (product.prices && product.prices[weight]) || product.price;
    const cartItemId = `${product.id}-${weight}`;

    const existingIndex = cart.findIndex(i => i.cartItemId === cartItemId);
    let newCart = [...cart];

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({
        cartItemId,
        id: product.id,
        name: product.shortName || product.name,
        fullName: product.name,
        price: Number(itemPrice),
        weight,
        image: product.image,
        quantity: 1
      });
    }

    saveCartToStorage(newCart);
    showToast(`🌶️ Added ${product.shortName || product.name} (${weight}) to cart!`);
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId, delta) => {
    let newCart = cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);

    saveCartToStorage(newCart);
  };

  const removeFromCart = (cartItemId) => {
    let newCart = cart.filter(item => item.cartItemId !== cartItemId);
    saveCartToStorage(newCart);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        showToast,
        user,
        isAdmin,
        adminRole,
        isAuthLoading,
        loginWithGoogle,
        logoutGoogle
      }}
    >
      <Head>
        <title>NE Roots | Authentic North Eastern Pickles • Handcrafted in Assam</title>
        <meta name="description" content="Artisanal North Eastern pickles made with cold-pressed mustard oil, Bhut Jolokia ghost peppers, Kazi Nemu lemons, and fermented bamboo shoot." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </Head>

      <Component {...pageProps} />

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer />

      {/* Floating Sticky Mobile Cart Thumb-Bar */}
      <StickyCartBar />

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}
