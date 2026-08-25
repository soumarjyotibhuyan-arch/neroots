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
  const [vpa] = useState('neroots@icici');

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles Assam')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}&tr=${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`;

  // Active countdown timer effect
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300);
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
          maxWidth: 440,
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
          aria-label="Close UPI QR"
        >
          ✕
        </button>

        {/* Header Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <img src="/images/ner_logo_icon.jpg" alt="NE Roots Icon" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary-dark)' }}>NE Roots Express UPI</span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Order ID: <strong>#{orderId}</strong> • Amount: <strong style={{ color: 'var(--primary)', fontSize: 18 }}>₹{amountRupees}</strong>
        </div>

        {timeLeft > 0 ? (
          <>
            {/* Mobile UPI Intent Buttons */}
            {isMobile && (
              <div style={{ marginBottom: 20 }}>
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
                  <span>⚡ Pay via Installed UPI App</span>
                </a>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Opens Google Pay, PhonePe, Paytm, or CRED directly on your phone
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Or Scan QR Code</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }}></div>
                </div>
              </div>
            )}

            {/* Dynamic QR Code Card */}
            <div style={{
              background: '#ffffff',
              padding: 14,
              borderRadius: 14,
              border: '2px solid #e5e7eb',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              marginBottom: 14
            }}>
              <img
                src={qrCodeUrl}
                alt="Scan to Pay NE Roots Pickles via UPI"
                style={{ width: 190, height: 190, display: 'block', margin: '0 auto' }}
              />
            </div>

            {/* Live Expiration Countdown Timer */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: timeLeft < 60 ? '#fee2e2' : '#f0fdf4',
              color: timeLeft < 60 ? '#b91c1c' : '#166534',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16
            }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: timeLeft < 60 ? '#ef4444' : '#22c55e', animation: 'pulse 1s infinite' }}></span>
              QR Expires in: <strong>{formatTime(timeLeft)}</strong>
            </div>

            {/* Supported UPI Apps Row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
              <span>🟢 Google Pay</span>
              <span>🟣 PhonePe</span>
              <span>🔵 Paytm</span>
              <span>⚫ BHIM</span>
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
              marginBottom: 18
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
            <h3 style={{ fontSize: 18, color: '#b91c1c', marginBottom: 6 }}>QR Code Expired</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              The 5-minute payment session has timed out to release reserved inventory.
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
