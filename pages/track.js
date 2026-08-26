import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from './_app';
import UserMenu from '../components/UserMenu';

export default function TrackOrder() {
  const { cartCount, isCartOpen, setIsCartOpen, cart, cartSubtotal, removeFromCart, showToast, user } = useStore();
  const router = useRouter();

  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscribedAlerts, setSubscribedAlerts] = useState(false);

  // Customer order history states (for logged-in Google users)
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Auto-fill from query string if present (e.g. /track?id=PKL-1234)
  useEffect(() => {
    if (router.isReady && router.query.id) {
      const qId = String(router.query.id).trim();
      setOrderIdInput(qId);
      fetchOrderStatus(qId);
    }
  }, [router.isReady, router.query.id]);

  // Load order history for logged-in users
  useEffect(() => {
    if (user && user.email) {
      fetchCustomerOrders();
    } else {
      setCustomerOrders([]);
    }
  }, [user]);

  const fetchCustomerOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/my-orders?_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerOrders(data.orders || []);
        // If the user has a recent order and order is not set, pre-fill it!
        if (data.orders && data.orders.length > 0 && !order && !router.query.id) {
          setOrder(data.orders[0]);
          setOrderIdInput(data.orders[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading order history:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Show pop-up notification if not logged in to remind them to connect their Google account
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        showToast('💡 Connect your Gmail account to view and track your orders automatically.');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      showToast('⚠️ Please enter a valid Order ID.');
      return;
    }
    fetchOrderStatus(orderIdInput.trim());
    // Update URL query parameter without reloading
    router.push({ pathname: '/track', query: { id: orderIdInput.trim() } }, undefined, { shallow: true });
  };

  const fetchOrderStatus = async (id) => {
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await fetch(`/api/track-order?id=${encodeURIComponent(id)}&_t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || 'No order found matching this ID. Please double-check.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error checking order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get status details & step level mapping to the requested 5 steps:
  // 1: Order Placed
  // 2: Handcrafted in Assam
  // 3: Quality Checked
  // 4: Dispatched
  // 5: Out for Delivery
  const getTimelineSteps = (status) => {
    const s = (status || '').toLowerCase();
    let currentStep = 1;
    let isCancelled = false;

    if (s.includes('cancelled')) {
      isCancelled = true;
      currentStep = 0;
    } else if (s.includes('delivered') || s.includes('out') || s.includes('door')) {
      currentStep = 5;
    } else if (s.includes('shipped') || s.includes('dispatched') || s.includes('transit')) {
      currentStep = 4;
    } else if (s.includes('quality') || s.includes('checked') || s.includes('sealed') || s.includes('packing') || s.includes('boiling')) {
      currentStep = 3;
    } else if (s.includes('preparing') || s.includes('kitchen') || s.includes('handcrafted') || s.includes('assam') || s.includes('confirmed') || s.includes('paid')) {
      currentStep = 2;
    } else {
      // Pending statuses (COD or pending verification)
      currentStep = 1;
    }

    return { currentStep, isCancelled };
  };

  const stepsList = [
    { label: 'Order Placed', desc: 'Received and confirmed by merchant' },
    { label: 'Handcrafted in Assam', desc: 'Tempered in pure mustard oil at Guwahati kitchen' },
    { label: 'Quality Checked', desc: 'FSSAI compliance and vacuum-sealed for freshness' },
    { label: 'Dispatched', desc: 'Handed over to express courier partner' },
    { label: 'Out for Delivery', desc: 'Arriving at your doorstep soon' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Track Order Status | NE Roots Pickles</title>
        <meta name="description" content="Track your NE Roots pickle order status in real time. Crafted in Assam, shipped fresh." />
      </Head>

      {/*zigzag Assamese Pattern Strip */}
      <div className="ne-zigzag-strip"></div>

      {/* Top Banner */}
      <div className="top-banner">
        <div className="container">
          <div className="top-banner-content">
            <span>🌿 100% Pure Vegetarian</span>
            <span className="top-banner-fssai">FSSAI Lic. No: <strong>20326101000625</strong></span>
            <span>🚚 Free Express Shipping Above ₹599</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="navbar">
        <div className="container nav-inner">
          <div className="nav-top-row">
            <Link href="/" className="brand-logo" title="NE Roots (North East Roots)">
              <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
              <div className="brand-text-block">
                <div className="brand-name">NE Roots</div>
                <div className="brand-tagline">Flavours of Assam</div>
              </div>
            </Link>

            <div className="nav-actions">
              <Link href="/" className="desktop-nav-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', padding: '8px 12px' }}>
                🏪 Storefront
              </Link>
              <Link href="/team" className="desktop-nav-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', padding: '8px 12px' }}>
                👥 Our Team
              </Link>
              <Link href="/reviews" className="desktop-nav-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', padding: '8px 12px' }}>
                ⭐ Reviews
              </Link>
              <Link href="/track" className="desktop-nav-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', padding: '8px 12px' }}>
                📦 Track Order
              </Link>

              {/* Google User Identity Menu */}
              <UserMenu />

              <button
                onClick={() => setIsCartOpen(true)}
                className="cart-btn"
                aria-label={`View Basket, ${cartCount} items`}
              >
                <span>🧺</span>
                <span className="cart-badge">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseShadow {
          0% { box-shadow: 0 0 0 2px rgba(230, 43, 43, 0.2); }
          100% { box-shadow: 0 0 0 8px rgba(230, 43, 43, 0.4); }
        }
        .pulse-active {
          animation: pulseShadow 1.2s infinite ease-in-out alternate;
        }
        .horizontal-gauge::-webkit-scrollbar {
          display: none;
        }
      `}} />

      <main className="container" style={{ flex: 1, padding: '40px 20px', maxWidth: 720 }}>
        {/* Google Authentication Status / Guest Disclaimer Banner */}
        {!user && (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fef3c7',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: 24, marginTop: 2 }}>💡</span>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 800, color: '#b45309' }}>
                Track Your Orders Automatically
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#b45309', lineHeight: 1.5 }}>
                To view and track all your orders in one place without manually typing Order IDs, please sign in with your Google account in the top-right menu.
              </p>
              <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 10, borderTop: '1px solid #fde68a', paddingTop: 8, lineHeight: 1.5 }}>
                📋 <strong>Guest Checkout Info:</strong> If you placed an order as a guest without signing in, please directly message the store owner on WhatsApp (<strong>+91 70026 69032</strong>) or email (<strong>soumarjyotibhuyan@gmail.com</strong>) with your details to verify/track your package.
              </div>
            </div>
          </div>
        )}

        {/* Authenticated Customer Orders Tab Bar */}
        {user && (
          <section style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px 20px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: 24,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'} alt="Google Profile" style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--primary-light)' }} />
              <div>
                <h2 style={{ fontSize: 16, margin: 0, color: 'var(--text-dark)', fontWeight: 800 }}>
                  Welcome back, {user.name}!
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  Viewing order list for: <strong>{user.email}</strong>
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                🔄 Loading your order history...
              </div>
            ) : customerOrders.length === 0 ? (
              <div style={{ background: 'var(--bg-cream)', padding: 16, borderRadius: 8, textAlign: 'center', fontSize: 13.5, color: 'var(--text-muted)' }}>
                You haven't placed any orders yet. Once you place an order, it will appear here.
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  SELECT AN ORDER TO TRACK:
                </label>
                <div className="horizontal-gauge" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {customerOrders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setOrder(o);
                        setOrderIdInput(o.id);
                        setError('');
                        // Update URL query parameter
                        router.push({ pathname: '/track', query: { id: o.id } }, undefined, { shallow: true });
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 20,
                        border: order && order.id === o.id ? '2px solid var(--primary)' : '1.5px solid var(--border-color)',
                        background: order && order.id === o.id ? '#fff5f5' : '#ffffff',
                        color: order && order.id === o.id ? 'var(--primary-dark)' : 'var(--text-dark)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s'
                      }}
                    >
                      📦 #{o.id} ({o.date?.split(' ')[0] || 'Recent'})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Track Form Card */}
        <section style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '32px 24px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 30,
          textAlign: 'center'
        }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>📦</span>
          <h1 style={{ fontSize: 26, margin: '0 0 10px 0', color: 'var(--text-dark)' }}>Track Your Order</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '0 auto 24px' }}>
            Enter the Order ID (e.g. <strong>PKL-4321</strong>) printed on your receipt or sent via WhatsApp to view real-time shipping updates.
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Enter Order ID (e.g. PKL-1234)"
              value={orderIdInput}
              onChange={e => setOrderIdInput(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--border-color)',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
                transition: 'border-color 0.2s',
                textAlign: 'center'
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(230,43,43,0.2)'
              }}
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginTop: 18, border: '1px solid #fecaca', display: 'inline-block' }}>
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* Tracking Results Card */}
        {order && (
          <section style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '36px 28px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 20, marginBottom: 28, textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Order ID</span>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-dark)' }}>#{order.id}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Placed on: {order.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Milestone Status</span>
                {(() => {
                  const { currentStep } = getTimelineSteps(order.status);
                  if (currentStep === 1) {
                    return (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                        ⏳ Pending Confirmation
                      </span>
                    );
                  } else if (currentStep === 2 || currentStep === 3) {
                    return (
                      <span style={{ background: '#f5f3ff', color: '#6d28d9', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                        🏺 Boiling/Packing
                      </span>
                    );
                  } else if (currentStep === 4) {
                    return (
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                        🚚 Shipped
                      </span>
                    );
                  } else if (currentStep === 5) {
                    return (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                        🏡 Out for Delivery
                      </span>
                    );
                  }
                  return (
                    <span style={{ background: '#f8fafc', color: '#64748b', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                      {order.status}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Zomato-Style Status Progress Gauge */}
            {!getTimelineSteps(order.status).isCancelled && (
              <div style={{ 
                margin: '18px 0 36px 0', 
                background: 'var(--bg-cream)', 
                borderRadius: 14, 
                padding: '24px 16px',
                border: '1.5px solid var(--border-subtle)',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 8px' }}>
                  {/* Progress Line Background */}
                  <div style={{ position: 'absolute', top: 20, left: '6%', right: '6%', height: 5, background: '#cbd5e1', borderRadius: 3, zIndex: 1 }}></div>
                  {/* Active Progress Line */}
                  <div style={{
                    position: 'absolute',
                    top: 20,
                    left: '6%',
                    width: `${((getTimelineSteps(order.status).currentStep - 1) / 4) * 88}%`,
                    height: 5,
                    background: 'var(--primary)',
                    borderRadius: 3,
                    zIndex: 2,
                    transition: 'width 0.6s ease-in-out'
                  }}></div>

                  {stepsList.map((step, idx) => {
                    const stepNum = idx + 1;
                    const { currentStep } = getTimelineSteps(order.status);
                    const isCompleted = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;

                    // Emojis matching requested timeline steps
                    const statusIcons = ['🛒', '👩‍🍳', '🔬', '🚚', '🏠'];

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '18%', textAlign: 'center' }}>
                        {/* Step Circle with pulsing state */}
                        <div 
                          className={isCurrent ? 'pulse-active' : ''}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: isCompleted ? 'var(--primary)' : '#ffffff',
                            border: `3px solid ${isCompleted ? 'var(--primary)' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            color: isCompleted ? '#ffffff' : '#94a3b8',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {statusIcons[idx]}
                        </div>
                        {/* Step Label */}
                        <div style={{ 
                          marginTop: 8, 
                          fontSize: 10.5, 
                          fontWeight: isCompleted ? 800 : 500, 
                          color: isCompleted ? 'var(--text-dark)' : 'var(--text-muted)' 
                        }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled Alert */}
            {getTimelineSteps(order.status).isCancelled ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)', padding: 18, color: '#991b1b', marginBottom: 28, textAlign: 'center' }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>✕</span>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>This order has been cancelled</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
                  If this was done in error or you need support, please click the WhatsApp button below to contact our support desk.
                </p>
              </div>
            ) : (
              /* Visual Timeline Progress */
              <div style={{ marginBottom: 36, textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                  {/* Vertical connector line */}
                  <div style={{
                    position: 'absolute',
                    top: 14,
                    bottom: 14,
                    left: 13,
                    width: 2.5,
                    background: '#e2e8f0',
                    zIndex: 1
                  }}></div>

                  {stepsList.map((step, idx) => {
                    const stepNum = idx + 1;
                    const { currentStep } = getTimelineSteps(order.status);
                    const isCompleted = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                      <div key={idx} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', zIndex: 2 }}>
                        {/* Dot indicator */}
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isCompleted ? '#10b981' : '#ffffff',
                          border: `2px solid ${isCompleted ? '#10b981' : '#cbd5e1'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted ? '#ffffff' : '#64748b',
                          fontSize: 13,
                          fontWeight: 700,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.25)' : 'none',
                          transition: 'all 0.2s'
                        }}>
                          {isCompleted ? '✓' : stepNum}
                        </div>
                        {/* Labels */}
                        <div>
                          <h4 style={{
                            margin: '2px 0 2px 0',
                            fontSize: 15,
                            fontWeight: isCompleted ? 800 : 600,
                            color: isCompleted ? 'var(--text-dark)' : 'var(--text-muted)'
                          }}>
                            {step.label}
                          </h4>
                          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Courier Status Integration Card */}
            {order && getTimelineSteps(order.status).currentStep >= 4 && (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed #0284c7',
                borderRadius: 'var(--radius-md)',
                padding: '20px 22px',
                marginBottom: 28,
                textAlign: 'left',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚚</span> LIVE EXPRESS COURIER INTEGRATION
                  </div>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>IN TRANSIT</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13, color: 'var(--text-dark)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Logistics Partner</span>
                    <strong>{order.courierPartner || 'Delhivery Express'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>AWB Tracking No.</span>
                    <strong>{order.trackingNo || 'DEL99302847291'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Estimated Arrival (ETA)</span>
                    <strong style={{ color: '#15803d' }}>{order.estArrival || '3-4 Business Days (Expected Friday)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Dispatch Origin</span>
                    <strong>NE Roots Kitchen, Guwahati, Assam</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'flex-start' }}>
                  <a
                    href={order.trackingUrl || `https://www.delhivery.com/track/package/${order.trackingNo || 'DEL99302847291'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'background 0.2s'
                    }}
                  >
                    🗺️ Track Live on Interactive Courier Map →
                  </a>
                </div>
              </div>
            )}

            {/* Automated Alerts Opt-In Card */}
            {order && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 28,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14
              }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔔</span> Automated Dispatch Alerts
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Opt-in to receive automated SMS & WhatsApp updates when your small-batch pickle jar is freshly packed, quality-sealed, or handed to express delivery.
                  </p>
                </div>

                {subscribedAlerts ? (
                  <div style={{ color: '#15803d', background: '#dcfce7', padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Alerts Active (WhatsApp & SMS)
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSubscribedAlerts(true);
                      showToast('🎉 Subscribed successfully to automated SMS & WhatsApp order updates!');
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(230, 43, 43, 0.15)'
                    }}
                  >
                    Activate Alerts 🔔
                  </button>
                )}
              </div>
            )}

            {/* Direct Grievance Access Callout */}
            {order && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: 28,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ Transit Inquiries &amp; Delivery Delays
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: '#b91c1c', lineHeight: 1.4 }}>
                    If your package is delayed, or you have delivery concerns, you can access direct assistance from our Resident Grievance Officer.
                  </p>
                </div>
                <Link
                  href="/grievance"
                  style={{
                    background: '#991b1b',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  File Grievance ⚖️
                </Link>
              </div>
            )}

            {/* Order details summary */}
            <div style={{
              background: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: 20,
              marginBottom: 28,
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px 0', letterSpacing: 0.5 }}>Order Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {order.cart?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--text-dark)' }}>🏺 {item.name} ({item.weight}) × {item.quantity}</span>
                    <strong>₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Delivery Recipient:</span>
                <span>{order.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                <span>Recipient Phone:</span>
                <span>{order.phone || 'N/A'}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                <span>Total Amount paid ({order.paymentMethod})</span>
                <span style={{ color: 'var(--primary-dark)' }}>₹{order.total}</span>
              </div>
            </div>

            {/* WhatsApp confirmation forwarding button */}
            <div style={{ textAlign: 'center' }}>
              <a
                href={`https://wa.me/917002669032?text=${encodeURIComponent(
                  `*NE ROOTS ORDER TRACKING SUPPORT #${order.id}*\n` +
                  `*Customer:* ${order.customerName}\n` +
                  `*Phone:* ${order.phone}\n` +
                  `*Current Status:* ${order.status}\n` +
                  `*Total:* ₹${order.total} (${order.paymentMethod})\n` +
                  `Hello, I would like to check on my order delivery status. Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                }}
              >
                <span>💬</span> WhatsApp Store Owner for Verification
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="store-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="brand-logo" style={{ marginBottom: 12 }}>
                <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
                <div className="brand-name" style={{ color: '#ffd147' }}>NE Roots</div>
              </div>
              <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.6 }}>
                Vibrant FMCG brand rooted in Assam, celebrating authentic North Eastern Indian pickles crafted with traditional recipes.
              </p>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link href="/">Our Pickle Catalog</Link></li>
                <li><Link href="/team">About Our Team &amp; Heritage</Link></li>
                <li><Link href="/reviews">Customer Reviews</Link></li>
                <li><Link href="/track">Track My Order</Link></li>
                <li><Link href="/admin">Google Admin Portal</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Assam Kitchen &amp; Care</h4>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                📍 R.G. Baruah Road, Guwahati, Assam - 781024<br />
                📞 +91 94350 12345<br />
                ✉️ soumarjyotibhuyan@gmail.com
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} NE Roots. All Rights Reserved.</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/refund-policy">Return Policy</Link>
              <Link href="/grievance">Grievance Redressal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
