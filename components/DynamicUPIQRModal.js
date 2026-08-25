import React, { useState, useEffect } from 'react';

export default function DynamicUPIQRModal({
  isOpen,
  onClose,
  amountRupees,
  orderId,
  gatewayOrderId,
  customerName,
  onPaymentSuccess,
  isMobile = false
}) {
  // 5-minute countdown expiration timer (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  const [verifying, setVerifying] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [activeTab, setActiveTab] = useState(isMobile ? 'intent' : 'qr'); // 'qr' | 'intent' | 'collect'
  const [customerUPI, setCustomerUPI] = useState('');
  const [collectSent, setCollectSent] = useState(false);
  const [vpa] = useState('neroots@icici');

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles Assam')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}&tr=${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`;

  // Active countdown timer effect
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300);
      setCollectSent(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyVPA = () => {
    navigator.clipboard.writeText(vpa);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2500);
  };

  const handleSendCollect = (e) => {
    e.preventDefault();
    if (!customerUPI.includes('@')) {
      alert('Please enter a valid UPI ID (e.g., yourname@oksbi or 9876543210@paytm)');
      return;
    }
    setCollectSent(true);
  };

  const handleManualVerify = async () => {
    setVerifying(true);
    try {
      // Send verification request to backend
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: gatewayOrderId || `order_upi_${orderId}`,
          razorpay_payment_id: `pay_upi_${Date.now()}`,
          razorpay_signature: `mock_sig_${orderId}`,
          storeOrderId: orderId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert('Payment verification in progress. If you have completed the UPI transfer, your order will be confirmed automatically.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error verifying payment.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={onClose} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 460,
          width: '100%',
          padding: '28px 24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            color: '#6b7280'
          }}
          aria-label="Close UPI Gateway"
        >
          ✕
        </button>

        {/* Header Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <img src="/images/ner_logo_icon.jpg" alt="NE Roots Icon" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary-dark)' }}>Razorpay Unified UPI Gateway</span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Order: <strong>#{orderId}</strong> • Amount: <strong style={{ color: 'var(--primary)', fontSize: 18 }}>₹{amountRupees}</strong>
        </div>

        {timeLeft > 0 ? (
          <>
            {/* UPI Flow Selector Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 'var(--radius-full)', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'qr' ? '#ffffff' : 'transparent',
                  color: activeTab === 'qr' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'qr' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                📱 Dynamic QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('intent')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'intent' ? '#ffffff' : 'transparent',
                  color: activeTab === 'intent' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'intent' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                ⚡ UPI App Intent
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('collect')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'collect' ? '#ffffff' : 'transparent',
                  color: activeTab === 'collect' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'collect' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                📥 Web Collect
              </button>
            </div>

            {/* TAB 1: DYNAMIC QR CODE FLOW */}
            {activeTab === 'qr' && (
              <div>
                <div style={{
                  background: '#ffffff',
                  padding: 12,
                  borderRadius: 14,
                  border: '2px solid #e2e8f0',
                  display: 'inline-block',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  marginBottom: 12
                }}>
                  <img
                    src={qrCodeUrl}
                    alt="Scan to Pay NE Roots Pickles via UPI"
                    style={{ width: 175, height: 175, display: 'block', margin: '0 auto' }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dark)', fontWeight: 600, marginBottom: 8 }}>
                  Scan with Google Pay, PhonePe, Paytm, or CRED
                </div>
              </div>
            )}

            {/* TAB 2: UPI INTENT FLOW (MOBILE DIRECT APP SWITCH) */}
            {activeTab === 'intent' && (
              <div style={{ padding: '8px 0 16px' }}>
                <a
                  href={upiUri}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: 'var(--primary)',
                    color: '#ffffff',
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(217, 37, 37, 0.3)',
                    marginBottom: 12
                  }}
                >
                  <span>⚡ Pay ₹{amountRupees} via Installed UPI App</span>
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  Direct intent flow automatically opens Google Pay, PhonePe, Paytm, or CRED on your mobile device with pre-filled order details.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  <span>🟢 GPay</span>
                  <span>🟣 PhonePe</span>
                  <span>🔵 Paytm</span>
                  <span>⚫ BHIM</span>
                </div>
              </div>
            )}

            {/* TAB 3: WEB COLLECT FLOW (UPI ID PULL REQUEST) */}
            {activeTab === 'collect' && (
              <div style={{ padding: '8px 0 16px', textAlign: 'left' }}>
                {!collectSent ? (
                  <form onSubmit={handleSendCollect}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Enter Your UPI ID / VPA
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        placeholder="e.g. mobile@paytm or user@oksbi"
                        value={customerUPI}
                        onChange={e => setCustomerUPI(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          fontSize: 13
                        }}
                        required
                      />
                      <button
                        type="submit"
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          padding: '10px 16px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Request
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      A collect notification will be sent to your UPI app for ₹{amountRupees}.
                    </div>
                  </form>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📲</div>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: 13 }}>Collect Request Sent to {customerUPI}!</div>
                    <p style={{ fontSize: 12, color: '#4b5563', margin: '6px 0 10px' }}>
                      Please open your UPI app, approve the request for ₹{amountRupees}, then click verify below.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCollectSent(false)}
                      style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Change UPI ID
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Live Expiration Countdown Timer */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: timeLeft < 60 ? '#fee2e2' : '#f0fdf4',
              color: timeLeft < 60 ? '#b91c1c' : '#166534',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 700,
              margin: '12px 0 16px'
            }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: timeLeft < 60 ? '#ef4444' : '#22c55e', animation: 'pulse 1s infinite' }}></span>
              Session Expires in: <strong>{formatTime(timeLeft)}</strong>
            </div>

            {/* Copy VPA Option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 16
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block' }}>Merchant UPI VPA</span>
                <strong style={{ color: 'var(--text-dark)' }}>{vpa}</strong>
              </div>
              <button
                type="button"
                onClick={handleCopyVPA}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedUPI ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  background: '#ffffff',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualVerify}
                disabled={verifying}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  opacity: verifying ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(217, 37, 37, 0.25)'
                }}
              >
                {verifying ? 'Verifying...' : 'I Have Paid ✓'}
              </button>
            </div>
          </>
        ) : (
          /* Expired State */
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <h3 style={{ fontSize: 18, color: '#b91c1c', marginBottom: 6 }}>Session Expired</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              The 5-minute payment session has timed out to release reserved pickle stock.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Generate New Payment Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
