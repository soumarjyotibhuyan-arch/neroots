import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function DynamicUPIQRModal({
  isOpen,
  onClose,
  amountRupees,
  orderId,
  gatewayOrderId,
  customerName,
  customerPhone,
  onPaymentSuccess,
  isMobile = false
}) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [verifying, setVerifying] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [activeTab, setActiveTab] = useState(isMobile ? 'intent' : 'qr');
  const [customerUPI, setCustomerUPI] = useState('');
  const [upiUtr, setUpiUtr] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Configurable merchant UPI ID
  const vpa = process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || 'neroots@icici';

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles Assam')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}&tr=${orderId}`;

  // Generate QR Code locally via qrcode library (100% reliable, zero network dependency)
  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Local QR Code generation error:', err));
    }
  }, [upiUri]);

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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vpa);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2500);
    }
  };

  const handleSubmitUPIPayment = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/payment/confirm-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeOrderId: orderId,
          gatewayOrderId: gatewayOrderId || `order_upi_${orderId}`,
          upiUtr: upiUtr.trim() || 'Paid via UPI App',
          customerUPI: customerUPI.trim(),
          customerName: customerName || '',
          phone: customerPhone || '',
          amountRupees
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert(data.error || 'Could not verify payment submission. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error verifying payment. Please retry.');
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
          <img src="/images/ner_logo_icon.jpg" alt="NE Roots Icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--primary-dark)' }}>NE Roots UPI Payment</span>
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
                  minHeight: 40,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'qr' ? '#ffffff' : 'transparent',
                  color: activeTab === 'qr' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'qr' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📱 Scan QR Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('intent')}
                style={{
                  flex: 1,
                  minHeight: 40,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'intent' ? '#ffffff' : 'transparent',
                  color: activeTab === 'intent' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'intent' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                ⚡ Open UPI App
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
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      style={{ width: 200, height: 200, display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 13 }}>
                      Generating Secure UPI QR...
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Scan with any UPI App: <strong>GPay, PhonePe, Paytm, BHIM, CRED</strong>
                </div>
              </div>
            )}

            {/* TAB 2: 1-TAP UPI APP INTENT FLOW */}
            {activeTab === 'intent' && (
              <div style={{ padding: '4px 0 12px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 12 }}>
                  Tap your preferred UPI app to open and pay ₹{amountRupees}:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <a
                    href={`gpay://upi/pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}`}
                    className="upi-app-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#1e293b',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48
                    }}
                  >
                    <span>🔵</span> Google Pay
                  </a>

                  <a
                    href={`phonepe://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}`}
                    className="upi-app-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#5f259f',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48
                    }}
                  >
                    <span>🟣</span> PhonePe
                  </a>

                  <a
                    href={`paytmmp://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}`}
                    className="upi-app-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#00baf2',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48
                    }}
                  >
                    <span>🔷</span> Paytm UPI
                  </a>

                  <a
                    href={upiUri}
                    className="upi-app-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48
                    }}
                  >
                    <span>⚡</span> Other UPI Apps
                  </a>
                </div>
              </div>
            )}

            {/* Merchant UPI Details */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              margin: '12px 0'
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', display: 'block' }}>Merchant UPI ID (VPA)</span>
                <strong style={{ color: 'var(--text-dark)', fontSize: 13 }}>{vpa}</strong>
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

            {/* Optional UTR Input Field */}
            <div style={{ textAlign: 'left', marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                UPI Reference / UTR Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 12-digit UTR from GPay / PhonePe"
                value={upiUtr}
                onChange={e => setUpiUtr(e.target.value)}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13
                }}
              />
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Enter the 12-digit transaction number after paying in your UPI app.
              </span>
            </div>

            {/* Live Expiration Countdown Timer */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: timeLeft < 60 ? '#fee2e2' : '#f0fdf4',
              color: timeLeft < 60 ? '#b91c1c' : '#166534',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16
            }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: timeLeft < 60 ? '#ef4444' : '#22c55e' }}></span>
              Session Expires in: <strong>{formatTime(timeLeft)}</strong>
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
                onClick={handleSubmitUPIPayment}
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
                {verifying ? 'Submitting...' : 'I Have Paid ✓'}
              </button>
            </div>
          </>
        ) : (
          /* Expired State */
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <h3 style={{ fontSize: 18, color: '#b91c1c', marginBottom: 6 }}>Session Expired</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              The 5-minute payment session has timed out.
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
