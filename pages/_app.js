import '../styles/globals.css';
import Head from 'next/head';
import { createContext, useContext, useState, useEffect } from 'react';

export const StoreContext = createContext();

export function useStore() {
  return useContext(StoreContext);
}

export default function App({ Component, pageProps }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

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
        clearCart,
        showToast
      }}
    >
      <Head>
        <title>Nani&apos;s Rasoi - Artisanal Indian Pickles & Achaar</title>
        <meta name="description" content="Handcrafted traditional Indian pickles made with cold-pressed mustard oil, sun-dried raw spices, and traditional recipes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Component {...pageProps} />

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
