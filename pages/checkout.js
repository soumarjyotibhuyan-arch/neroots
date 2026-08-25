import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from './_app';
import GoogleSignInBtn from '../components/GoogleSignInBtn';
import UserMenu from '../components/UserMenu';
import DynamicUPIQRModal from '../components/DynamicUPIQRModal';

export default function Checkout() {
  const router = useRouter();
  const { cart, cartSubtotal, clearCart, showToast, user } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Online Paid');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [consentChecked, setConsentChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Dynamic UPI QR Modal state for desktop / fallback
  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  // Auto-fill customer name and email if logged in with Google
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  const shipping = cartSubtotal >= 599 || couponApplied === 'FREESHIP' ? 0 : 49;
  const total = Math.max(0, cartSubtotal - discount + shipping);

  const applyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'PICKLE10' || code === 'NEROOTS10') {
      const discountVal = Math.round(cartSubtotal * 0.1);
      setDiscount(discountVal);
      setCouponApplied(code);
      showToast(`🎉 Coupon ${code} applied! ₹${discountVal} off!`);
    } else if (code === 'FREESHIP') {
      setDiscount(0);
      setCouponApplied('FREESHIP');
      showToast('🎉 Free shipping coupon applied!');
    } else {
      showToast('❌ Invalid coupon code. Try NEROOTS10');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      showToast('⚠️ Please complete all required address fields.');
      return;
    }
    if (!consentChecked) {
      showToast('⚠️ Please accept the Terms and Consumer Policies to proceed.');
      return;
    }
    if (cart.length === 0) {
      showToast('⚠️ Your basket is empty.');
      return;
    }

    setLoading(true);
    const fullAddress = `${address.trim()}, ${city.trim()} - ${pincode.trim()}`;

    try {
      // -------------------------------------------------------------
      // 1. CASH ON DELIVERY (COD) FLOW
      // -------------------------------------------------------------
      if (paymentMethod === 'Cash on Delivery') {
        const payload = {
          customerName: name.trim(),
          phone: phone.trim(),
          email: email.trim() || (user?.email || ''),
          address: fullAddress,
          notes: notes.trim(),
          paymentMethod: 'Cash on Delivery',
          discount,
          shipping,
          cart,
          customerId: user?.id || null,
          googleEmail: user?.email || null,
          isGoogleVerified: Boolean(user)
        };

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const orderData = await res.json();
          setCompletedOrder(orderData);
          clearCart();
          showToast('✅ Cash on Delivery order placed successfully!');
        } else {
          showToast('❌ Failed to place COD order. Please try again.');
        }
        setLoading(false);
        return;
      }

      // -------------------------------------------------------------
      // 2. UNIFIED ONLINE PAYMENT (RAZORPAY + UPI INTENT / DYNAMIC QR)
      // -------------------------------------------------------------
      const orderInitRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          customerName: name.trim(),
          email: email.trim() || (user?.email || ''),
          phone: phone.trim(),
          address: fullAddress,
          discount,
          notes: notes.trim(),
          customerId: user?.id || null
        })
      });

      const orderData = await orderInitRes.json();
      if (!orderInitRes.ok || !orderData.success) {
        showToast(`❌ ${orderData.error || 'Failed to initialize payment gateway'}`);
        setLoading(false);
        return;
      }

      // Check if Razorpay client SDK is loaded in browser
      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzpOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'NE Roots (North East Roots)',
          description: `Assam Artisanal Pickles • Order #${orderData.storeOrderId}`,
          image: '/images/ner_logo_icon.jpg',
          order_id: orderData.orderId,
          prefill: {
            name: name.trim(),
            email: email.trim() || (user?.email || ''),
            contact: phone.trim()
          },
          theme: {
            color: '#e62b2b'
          },
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'Instant Payment',
                  instruments: [
                    { method: 'upi' },
                    { method: 'card' },
                    { method: 'netbanking' }
                  ]
                }
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: true
              }
            }
          },
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  storeOrderId: orderData.storeOrderId
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                setCompletedOrder(verifyData.order);
                clearCart();
                showToast('🎉 Payment verified! Order confirmed!');
              } else {
                showToast('⚠️ Payment received. Order status updating...');
              }
            } catch (err) {
              console.error('Verify error:', err);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              showToast('ℹ️ Payment checkout closed. You can retry or scan the Dynamic UPI QR.');
            }
          }
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on('payment.failed', function (response) {
          setLoading(false);
          showToast(`❌ Payment declined: ${response.error?.description || 'Transaction failed'}`);
        });
        rzp.open();
      } else {
        // Fallback to Dynamic UPI QR Modal with 5-minute timer
        setPendingPaymentOrder({
          orderId: orderData.storeOrderId,
          gatewayOrderId: orderData.orderId,
          amountRupees: orderData.amountRupees,
          customerName: name.trim()
        });
        setIsUPIModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Network error while initiating payment.');
    } finally {
      setLoading(false);
    }
  };

  // Order Confirmation Success View
  if (completedOrder) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
        <Head>
          <title>Order Confirmed #{completedOrder.id} | NE Roots</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="ne-zigzag-strip"></div>
        <header className="navbar">
          <div className="container nav-inner">
            <Link href="/" className="brand-logo">
              <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
              <div>
                <div className="brand-name">NE Roots</div>
                <div className="brand-tagline">Flavours of Assam &amp; North East</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="container" style={{ flex: 1, padding: '40px 20px', maxWidth: 700 }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '40px 32px',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 72,
              height: 72,
              background: '#d8f3dc',
              color: '#2d6a4f',
              fontSize: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              ✓
            </div>

            <h1 style={{ fontSize: 28, color: 'var(--primary-dark)', marginBottom: 8 }}>
              Order Placed Successfully!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Thank you, <strong>{completedOrder.customerName}</strong>! NE Roots kitchen in Assam is packaging your fresh artisanal pickle jars.
            </p>

            <div style={{
              background: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: 20,
              margin: '28px 0',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order Number</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>#{completedOrder.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-spice)' }}>{completedOrder.status}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Address</span>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{completedOrder.address}</div>
                {completedOrder.phone && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📞 {completedOrder.phone}</div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items Ordered</span>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {completedOrder.cart.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>🌶️ {item.name} ({item.weight}) × {item.quantity}</span>
                      <strong style={{ color: 'var(--text-dark)' }}>₹{item.price * item.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                <span>Total Amount Paid/Payable ({completedOrder.paymentMethod})</span>
                <span style={{ color: 'var(--primary-dark)' }}>₹{completedOrder.total}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              🚚 Expected Express Delivery: 3 to 5 business days. In case of any transit damages, report within 48 hours for a free replacement under our <Link href="/refund-policy" style={{ color: 'var(--accent-spice)', textDecoration: 'underline' }}>Return &amp; Refund Policy</Link>.
            </div>

            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                  `*NE ROOTS ORDER CONFIRMATION #${completedOrder.id}*\n` +
                  `*Customer:* ${completedOrder.customerName}\n` +
                  `*Phone:* ${completedOrder.phone}\n` +
                  `*Delivery Address:* ${completedOrder.address}\n` +
                  `*Items:*\n` +
                  completedOrder.cart.map(i => `- ${i.name} (${i.weight}) x ${i.quantity}: ₹${i.price * i.quantity}`).join('\n') +
                  `\n*Total:* ₹${completedOrder.total} (${completedOrder.paymentMethod})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 15,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                  minHeight: 48,
                  touchAction: 'manipulation'
                }}
              >
                <span>💬</span> Track / Confirm Order via WhatsApp
              </a>
            </div>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 15
                }}
              >
                Back to NE Roots Storefront
              </Link>
              <Link
                href="/admin"
                style={{
                  background: 'var(--bg-cream)',
                  color: 'var(--text-dark)',
                  border: '1px solid var(--border-color)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                View in Admin Panel →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Secure Checkout | NE Roots (North East Roots)</title>
        <meta name="description" content="Complete your order of handcrafted artisanal pickles from Assam. Express delivery across India with 100% consumer protection." />
        <link rel="canonical" href="https://neroots.in/checkout" />
      </Head>
      <div className="ne-zigzag-strip"></div>
      {/* Navbar */}
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-logo">
            <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
            <div>
              <div className="brand-name">NE Roots</div>
              <div className="brand-tagline">Artisanal Pickles of Assam</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <UserMenu />
            <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
              ← Return to Store
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '36px 20px', maxWidth: 1040 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Finalize Your Order</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Fresh handcrafted North Eastern pickles packed with pride in Assam and shipped with statutory consumer protection.
        </p>

        {cart.length === 0 ? (
          <div style={{ background: '#fff', padding: '60px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
            <h2>Your basket is empty</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>You haven&apos;t added any NE Roots pickles to your basket yet.</p>
            <Link
              href="/"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 15
              }}
            >
              Browse NE Roots Pickles
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }} className="checkout-grid">
            {/* Left Column: Delivery & Payment Details */}
            <div>
              <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Shipping Details Card */}
                <div style={{ background: '#fff', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(217, 37, 37, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                    <h3 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📍</span> Shipping &amp; Contact Details
                    </h3>
                    {user && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e6f4ea', color: '#137333', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                        ✓ Google Verified Customer
                      </span>
                    )}
                  </div>

                  {/* 1-Click Fast Checkout with Google Banner */}
                  {!user ? (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                          ⚡ 1-Click Fast Checkout with Google
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Sign in to automatically fill your name and email.
                        </div>
                      </div>
                      <GoogleSignInBtn size="medium" label="Fast Sign In" />
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                        alt={user.name}
                        style={{ width: 34, height: 34, borderRadius: '50%' }}
                      />
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <div style={{ fontWeight: 700, color: '#166534' }}>
                          Signed in as {user.name}
                        </div>
                        <div style={{ color: '#4b5563', fontSize: 12 }}>
                          {user.email} • Your order will be linked to your account
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Full Name <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Priyanshu Borah"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoComplete="name"
                        autoCapitalize="words"
                        style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                        required
                      />
                    </div>

                    <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          Mobile Number <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="e.g. 9876543210"
                          maxLength={10}
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          Email Address (For Tax Invoice)
                        </label>
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="priyanshu@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Street Address, Flat / House No <span style={{ color: 'red' }}>*</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. House No 42, Zoo Road Tiniali, RG Baruah Road"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        autoComplete="street-address"
                        style={{ width: '100%', minHeight: 64, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                        required
                      />
                    </div>

                    <div className="checkout-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          City <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Guwahati"
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          autoComplete="address-level2"
                          style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                          PIN Code <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="e.g. 781024"
                          value={pincode}
                          onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                          autoComplete="postal-code"
                          style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Special Delivery Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fragile glass jars, leave with security"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        style={{ width: '100%', minHeight: 46, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 15 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Selection Card */}
                <div style={{ background: '#fff', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💳</span> Select Payment Method
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: 14,
                        borderRadius: 10,
                        border: paymentMethod === 'Cash on Delivery' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: paymentMethod === 'Cash on Delivery' ? '#fff5f5' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Cash on Delivery'}
                        onChange={() => setPaymentMethod('Cash on Delivery')}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>💵 Cash on Delivery (COD)</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pay cash or UPI upon package delivery at your door</div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: 14,
                        borderRadius: 10,
                        border: paymentMethod === 'UPI / Online Paid' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: paymentMethod === 'UPI / Online Paid' ? '#fff5f5' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'UPI / Online Paid'}
                        onChange={() => setPaymentMethod('UPI / Online Paid')}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>📱 Instant UPI &amp; Cards (Encrypted Gateway)</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pay securely via GPay, PhonePe, Paytm, or Credit/Debit Cards</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Explicit Consumer Protection & DPDP Consent Checkbox */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '14px 16px',
                  background: '#fff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: 13
                }}>
                  <input
                    type="checkbox"
                    id="legalConsent"
                    checked={consentChecked}
                    onChange={e => setConsentChecked(e.target.checked)}
                    style={{ marginTop: 3, cursor: 'pointer' }}
                  />
                  <label htmlFor="legalConsent" style={{ color: 'var(--text-dark)', cursor: 'pointer', lineHeight: 1.5 }}>
                    I acknowledge that I have reviewed and agree to NE Roots{' '}
                    <Link href="/terms" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link>,{' '}
                    <Link href="/privacy" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy (DPDP Act)</Link>, and{' '}
                    <Link href="/refund-policy" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>48-Hour Return &amp; Refund Policy</Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(217, 37, 37, 0.3)',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Confirming Order...' : `Place Order • ₹${total}`}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary & Coupon */}
            <div>
              <div style={{ background: '#fff', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'sticky', top: 96 }}>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Order Summary</h3>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 260, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
                  {cart.map(item => (
                    <div key={item.cartItemId} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={item.image || '/images/mango_pickle.jpg'} alt={item.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Size: {item.weight} | Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                {/* Coupon Box */}
                <form onSubmit={applyCoupon} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="Coupon Code (try NEROOTS10)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, textTransform: 'uppercase' }}
                  />
                  <button
                    type="submit"
                    style={{ background: 'var(--primary)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
                  >
                    Apply
                  </button>
                </form>

                {couponApplied && (
                  <div style={{ background: '#d8f3dc', color: '#2d6a4f', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                    ✓ Applied: {couponApplied} ({couponApplied.includes('10') ? '10% Discount' : 'Free Delivery'})
                  </div>
                )}

                {/* Calculation Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Items Subtotal (GST Included)</span>
                    <span>₹{cartSubtotal}</span>
                  </div>

                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2d6a4f', fontWeight: 600 }}>
                      <span>Discount ({couponApplied})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery Charges</span>
                    <span>{shipping === 0 ? <strong style={{ color: '#2d6a4f' }}>FREE</strong> : `₹${shipping}`}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--primary-dark)', borderTop: '1px solid var(--border-color)', paddingTop: 10, marginTop: 4 }}>
                    <span>Final Amount Payable</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-cream)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>🚚 <strong>Pan-India Express:</strong> Dispatched from Assam in 24 hrs. Delivery in 3-5 days.</div>
                  <div>🛡️ <strong>Consumer Protection Guarantee:</strong> 100% replacement or refund for jars damaged during transit.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Desktop & Fallback Dynamic UPI QR Modal with 5-Minute Countdown Timer */}
      {pendingPaymentOrder && (
        <DynamicUPIQRModal
          isOpen={isUPIModalOpen}
          onClose={() => setIsUPIModalOpen(false)}
          amountRupees={pendingPaymentOrder.amountRupees}
          orderId={pendingPaymentOrder.orderId}
          gatewayOrderId={pendingPaymentOrder.gatewayOrderId}
          customerName={pendingPaymentOrder.customerName}
          isMobile={isMobile}
          onPaymentSuccess={(confirmedOrder) => {
            setIsUPIModalOpen(false);
            setCompletedOrder(confirmedOrder);
            clearCart();
            showToast('🎉 Payment confirmed! Order placed successfully!');
          }}
        />
      )}
    </div>
  );
}
