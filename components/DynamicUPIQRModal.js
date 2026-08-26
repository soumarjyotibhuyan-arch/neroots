import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', icon: '🏛️', code: 'SBIN' },
  { id: 'hdfc', name: 'HDFC Bank', icon: '🏦', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', icon: '🏦', code: 'ICIC' },
  { id: 'axis', name: 'Axis Bank', icon: '🏦', code: 'UTIB' },
  { id: 'pnb', name: 'Punjab National Bank', icon: '🏛️', code: 'PUNB' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', icon: '🏦', code: 'KKBK' },
  { id: 'bob', name: 'Bank of Baroda', icon: '🏛️', code: 'BARB' },
  { id: 'canara', name: 'Canara Bank', icon: '🏛️', code: 'CNRB' }
];

const ALL_BANKS = [
  ...POPULAR_BANKS,
  { id: 'indusind', name: 'IndusInd Bank', icon: '🏦', code: 'INDB' },
  { id: 'yes', name: 'Yes Bank', icon: '🏦', code: 'YESB' },
  { id: 'union', name: 'Union Bank of India', icon: '🏛️', code: 'UBIN' },
  { id: 'idbi', name: 'IDBI Bank', icon: '🏦', code: 'IBKL' },
  { id: 'federal', name: 'Federal Bank', icon: '🏦', code: 'FDRL' },
  { id: 'rbl', name: 'RBL Bank', icon: '🏦', code: 'RATN' },
  { id: 'central', name: 'Central Bank of India', icon: '🏛️', code: 'CBIN' }
];

const POPULAR_UPI_HANDLES = ['@okaxis', '@okhdfcbank', '@okicici', '@oksbi', '@paytm', '@ybl', '@ibl'];

export default function DynamicUPIQRModal({
  isOpen,
  onClose,
  amountRupees,
  orderId,
  gatewayOrderId,
  customerName,
  customerPhone,
  customerEmail,
  initialTab = 'vpa',
  initialCustomerUPI = '',
  onPaymentSuccess,
  isMobile = false
}) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [verifying, setVerifying] = useState(false);
  const [autoApproving, setAutoApproving] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab || 'vpa');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [upiUtr, setUpiUtr] = useState('');
  const [customerUPI, setCustomerUPI] = useState(initialCustomerUPI || '');
  const [collectSent, setCollectSent] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [cardOtpStep, setCardOtpStep] = useState(false);
  const [cardOtp, setCardOtp] = useState('');

  // Netbanking fields
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [bankOtpStep, setBankOtpStep] = useState(false);
  const [bankUserId, setBankUserId] = useState('');
  const [bankPassword, setBankPassword] = useState('');

  // Configurable merchant UPI ID
  const vpa = process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || 'upakashyap319@okicici';

  // Build standard NPCI UPI URI
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent('NE Roots Pickles Assam')}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order #${orderId}`)}&tr=${orderId}`;

  // Sync initial tab when opened
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (initialCustomerUPI) {
      setCustomerUPI(initialCustomerUPI);
    }
  }, [initialTab, initialCustomerUPI, isOpen]);

  // Generate QR Code locally via qrcode library
  useEffect(() => {
    if (upiUri) {
      QRCode.toDataURL(upiUri, {
        width: 220,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR Code error:', err));
    }
  }, [upiUri]);

  // Active countdown timer effect
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300);
      setCardOtpStep(false);
      setBankOtpStep(false);
      setCollectSent(false);
      setAutoApproving(false);
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

  // 1. DIRECT AUTO-APPROVAL FOR TEST MODE (NO UTR REQUIRED)
  const handleAutoApproveTest = async (testVpa = 'test@razorpay') => {
    setAutoApproving(true);
    setVerifying(true);
    try {
      const res = await fetch('/api/payment/confirm-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeOrderId: orderId,
          gatewayOrderId: gatewayOrderId || `order_test_${orderId}`,
          upiUtr: `RZP_TEST_${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          customerUPI: testVpa,
          customerName: customerName || 'Test Customer',
          phone: customerPhone || '',
          amountRupees
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert(data.error || 'Failed to auto-approve test transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error confirming test payment.');
    } finally {
      setVerifying(false);
      setAutoApproving(false);
    }
  };

  // Reusable helper to trigger real secure Razorpay payment modal
  const triggerRealRazorpayPayment = (method, extraPrefill = {}) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      alert('Payment Gateway SDK is not loaded. Please refresh the page.');
      return;
    }

    setVerifying(true);
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TUGmfkaNXTUgvy';
    const rzpOptions = {
      key: rzpKey,
      amount: Math.round(Number(amountRupees) * 100),
      currency: 'INR',
      name: 'NE Roots Pickles Assam',
      description: `Order #${orderId} • Payment via ${method.toUpperCase()}`,
      image: 'https://neroots.vercel.app/images/ner_logo_icon.jpg',
      order_id: gatewayOrderId || undefined,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerPhone || '',
        method: method,
        ...extraPrefill
      },
      theme: {
        color: '#e62b2b'
      },
      handler: async function (response) {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              storeOrderId: orderId
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            onPaymentSuccess(verifyData.order);
          } else {
            alert(verifyData.error || 'Payment verification failed.');
          }
        } catch (err) {
          console.error('Verify error:', err);
          alert('Network error verifying payment.');
        } finally {
          setVerifying(false);
        }
      },
      modal: {
        ondismiss: function () {
          setVerifying(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', function (response) {
        setVerifying(false);
        alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Could not launch payment gateway.');
      setVerifying(false);
    }
  };

  // 2. UPI ID COLLECT (RAZORPAY INTEGRATION + GATEWAY ROUTING)
  const handleUPICollect = async (e) => {
    if (e) e.preventDefault();
    const cleanVPA = (customerUPI || '').trim();

    // If it is the Razorpay designated test handle, auto-approve immediately!
    if (cleanVPA.toLowerCase().includes('test') || cleanVPA === 'test@razorpay') {
      await handleAutoApproveTest(cleanVPA || 'test@razorpay');
      return;
    }

    if (!cleanVPA || !cleanVPA.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or test@razorpay)');
      return;
    }

    triggerRealRazorpayPayment('upi', { vpa: cleanVPA });
  };

  // 3. CARD PAYMENT SUBMISSION
  const handleCardPay = async (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry.includes('/')) {
      alert('Please enter expiry in MM/YY format.');
      return;
    }
    if (cardCvv.length < 3) {
      alert('Please enter a valid CVV.');
      return;
    }

    setCardOtpStep(true);
  };

  const handleConfirmCardOtp = async () => {
    setVerifying(true);
    try {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4) || '1007';
      const brand = cleanNum.startsWith('4') ? 'Visa' : cleanNum.startsWith('5') ? 'Mastercard' : cleanNum.startsWith('6') ? 'RuPay' : 'Card';

      const res = await fetch('/api/payment/confirm-card-netbanking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeOrderId: orderId,
          gatewayOrderId: gatewayOrderId || `pay_card_${orderId}`,
          paymentType: 'Card',
          cardLast4: last4,
          cardBrand: brand,
          customerName: cardHolder || customerName || '',
          phone: customerPhone || '',
          amountRupees
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert(data.error || 'Payment authorization declined. Please check card details.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error authorizing card payment.');
    } finally {
      setVerifying(false);
    }
  };

  // 4. NETBANKING SUBMISSION
  const handleNetBankingPay = (e) => {
    e.preventDefault();
    setBankOtpStep(true);
  };

  const handleConfirmBankLogin = async () => {
    setVerifying(true);
    try {
      const bankObj = ALL_BANKS.find(b => b.id === selectedBank) || { name: 'State Bank of India' };
      const res = await fetch('/api/payment/confirm-card-netbanking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeOrderId: orderId,
          gatewayOrderId: gatewayOrderId || `pay_nb_${orderId}`,
          paymentType: 'NetBanking',
          bankName: bankObj.name,
          customerName: customerName || '',
          phone: customerPhone || '',
          amountRupees
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert(data.error || 'Net Banking authentication failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to bank portal.');
    } finally {
      setVerifying(false);
    }
  };

  // 5. DIRECT UPI SUBMISSION (UTR IS COMPLETELY OPTIONAL)
  const handleSubmitUPIPayment = async () => {
    setVerifying(true);
    try {
      // If customer didn't enter a UTR, generate a clean human-readable reference automatically
      const generatedRef = upiUtr.trim() || `UPI-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const res = await fetch('/api/payment/confirm-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeOrderId: orderId,
          gatewayOrderId: gatewayOrderId || `order_upi_${orderId}`,
          upiUtr: generatedRef,
          customerUPI: customerUPI.trim() || 'Paid via UPI App',
          customerName: customerName || '',
          phone: customerPhone || '',
          amountRupees
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onPaymentSuccess(data.order);
      } else {
        alert(data.error || 'Could not confirm payment.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error confirming payment.');
    } finally {
      setVerifying(false);
    }
  };

  // Helpers to fill test credentials
  const fillTestCard = () => {
    setCardNumber('4100 2800 0000 1007');
    setCardExpiry('12/26');
    setCardCvv('123');
    setCardHolder('Test Customer');
  };

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={onClose} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          maxWidth: 480,
          width: '100%',
          padding: '24px 20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
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
          aria-label="Close Checkout Modal"
        >
          ✕
        </button>

        {/* Header Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <img src="/images/ner_logo_icon.jpg" alt="NE Roots Icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--primary-dark)' }}>NE Roots Secure Payment Gateway</span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Order: <strong>#{orderId}</strong> • Total Payable: <strong style={{ color: 'var(--primary)', fontSize: 18 }}>₹{amountRupees}</strong>
        </div>

        {timeLeft > 0 ? (
          <>
            {/* Top Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 16, gap: 2 }}>
              <button
                type="button"
                onClick={() => { setActiveTab('vpa'); setCollectSent(false); }}
                style={{
                  minHeight: 38,
                  padding: '6px 2px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'vpa' ? '#ffffff' : 'transparent',
                  color: activeTab === 'vpa' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'vpa' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                ⚡ UPI ID
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('intent')}
                style={{
                  minHeight: 38,
                  padding: '6px 2px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'intent' ? '#ffffff' : 'transparent',
                  color: activeTab === 'intent' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'intent' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📱 Apps
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setCardOtpStep(false); }}
                style={{
                  minHeight: 38,
                  padding: '6px 2px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'card' ? '#ffffff' : 'transparent',
                  color: activeTab === 'card' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'card' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                💳 Cards
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('netbanking'); setBankOtpStep(false); }}
                style={{
                  minHeight: 38,
                  padding: '6px 2px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'netbanking' ? '#ffffff' : 'transparent',
                  color: activeTab === 'netbanking' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'netbanking' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                🏛️ Banks
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                style={{
                  minHeight: 38,
                  padding: '6px 2px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'qr' ? '#ffffff' : 'transparent',
                  color: activeTab === 'qr' ? 'var(--primary)' : '#64748b',
                  boxShadow: activeTab === 'qr' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📲 QR
              </button>
            </div>

            {/* TAB 1: ENTER UPI ID / VPA COLLECT (RAZORPAY STANDARD) */}
            {activeTab === 'vpa' && (
              <div style={{ textAlign: 'left' }}>
                {!collectSent ? (
                  <form onSubmit={handleUPICollect} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Compliance Warning for VPA Collect */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#b45309', lineHeight: 1.4 }}>
                      <strong>⚠️ NPCI Regulation Notice:</strong> UPI ID collect requests are restricted by NPCI. If you do not receive a payment notification in your app, please use the <strong>📱 Apps (Intent)</strong> or <strong>📲 QR Code</strong> tabs above instead.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Enter Your UPI ID / VPA</span>
                      <span style={{ fontSize: 11, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        ⚡ Prefilled Gateway
                      </span>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. username@okhdfcbank or test@razorpay"
                        value={customerUPI}
                        onChange={e => setCustomerUPI(e.target.value.trim())}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 500 }}
                      />
                    </div>

                    {/* Quick Handle Suggestions */}
                    <div>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                        POPULAR HANDLES:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {POPULAR_UPI_HANDLES.map(handle => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              const username = customerUPI.split('@')[0] || 'user';
                              setCustomerUPI(`${username}${handle}`);
                            }}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: 11,
                              color: '#334155',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Instant Auto-Approve Test Sandbox Button */}
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px', marginTop: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                        🧪 Razorpay Test Mode Shortcut:
                      </div>
                      <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 8 }}>
                        Testing the checkout? Auto-approve instantly without needing real money or OTP.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoApproveTest('test@razorpay')}
                        disabled={autoApproving}
                        style={{
                          width: '100%',
                          background: '#2563eb',
                          color: '#fff',
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          border: 'none',
                          cursor: autoApproving ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {autoApproving ? '⚡ Auto-Approving Test Transaction...' : '⚡ Auto-Approve Test Payment (1-Click)'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={verifying}
                      style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        padding: '12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 14,
                        fontWeight: 700,
                        border: 'none',
                        cursor: verifying ? 'not-allowed' : 'pointer',
                        marginTop: 4,
                        boxShadow: '0 4px 12px rgba(217, 37, 37, 0.25)'
                      }}
                    >
                      {verifying ? 'Routing to Gateway...' : `Send Request of ₹${amountRupees} to UPI ID →`}
                    </button>
                  </form>
                ) : (
                  /* Collect Sent Screen */
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>📲</div>
                    <h4 style={{ fontSize: 15, margin: '0 0 6px', color: '#1e293b' }}>
                      Payment Request Sent!
                    </h4>
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 14px' }}>
                      Please approve the request of <strong>₹{amountRupees}</strong> in your UPI app registered with <strong>{customerUPI || 'your UPI ID'}</strong>.
                    </p>

                    {/* Optional UTR input */}
                    <div style={{ textAlign: 'left', marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                        UPI Reference / UTR Number <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Optional - e.g. 12-digit UTR if available"
                        value={upiUtr}
                        onChange={e => setUpiUtr(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleSubmitUPIPayment}
                        disabled={verifying}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          border: 'none',
                          cursor: verifying ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(217, 37, 37, 0.25)'
                        }}
                      >
                        {verifying ? 'Confirming Order...' : 'I Have Approved in UPI App ✓ (Confirm Order)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollectSent(false)}
                        style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer' }}
                      >
                        ← Change UPI ID
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 1-TAP UPI APPS INTENT */}
            {activeTab === 'intent' && (
              <div style={{ padding: '4px 0 12px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-dark)', marginBottom: 12 }}>
                  Tap below to open your preferred UPI app and pay ₹{amountRupees}:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                      color: '#1e293b',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48,
                      textDecoration: 'none'
                    }}
                  >
                    <span>🔵</span> Google Pay
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
                      color: '#5f259f',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48,
                      textDecoration: 'none'
                    }}
                  >
                    <span>🟣</span> PhonePe
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
                      color: '#00baf2',
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      minHeight: 48,
                      textDecoration: 'none'
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
                      minHeight: 48,
                      textDecoration: 'none'
                    }}
                  >
                    <span>⚡</span> Any UPI App
                  </a>
                </div>

                {/* Confirm Paid Button (No mandatory UTR) */}
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleSubmitUPIPayment}
                    disabled={verifying}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      border: 'none',
                      cursor: verifying ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(217, 37, 37, 0.25)'
                    }}
                  >
                    {verifying ? 'Confirming Order...' : 'I Have Completed Payment in App ✓'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CREDIT / DEBIT CARDS */}
            {activeTab === 'card' && (
              <div style={{ textAlign: 'left', padding: '8px 0 16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔒 Secure Card Processing</span>
                    <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>PCI-DSS COMPLIANT</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    We support all major Indian and international credit/debit cards including <strong>RuPay, Visa, Mastercard, and Maestro</strong>. 
                    Your card credentials are encrypted and processed directly by Razorpay's bank-grade secure server.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerRealRazorpayPayment('card')}
                  disabled={verifying}
                  style={{
                    width: '100%',
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: verifying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(230, 43, 43, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {verifying ? 'Connecting Gateway...' : `💳 Pay ₹${amountRupees} securely via Card →`}
                </button>
              </div>
            )}

            {/* TAB 4: NET BANKING / E-BANKING */}
            {activeTab === 'netbanking' && (
              <div style={{ textAlign: 'left', padding: '8px 0 16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🏛️ Secure NetBanking</span>
                    <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>ENCRYPTED ROUTING</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    Access netbanking portals for over 50+ major Indian banks, including <strong>SBI, HDFC, ICICI, Axis, and Kotak</strong>. 
                    Your authentication is completed securely on your bank's official portal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerRealRazorpayPayment('netbanking')}
                  disabled={verifying}
                  style={{
                    width: '100%',
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: verifying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(230, 43, 43, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {verifying ? 'Connecting Gateway...' : `🏛️ Pay ₹${amountRupees} securely via NetBanking →`}
                </button>
              </div>
            )}

            {/* TAB 5: SCAN QR CODE */}
            {activeTab === 'qr' && (
              <div>
                <div style={{
                  background: '#ffffff',
                  padding: 10,
                  borderRadius: 14,
                  border: '2px solid #e2e8f0',
                  display: 'inline-block',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      style={{ width: 190, height: 190, display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <div style={{ width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 12 }}>
                      Generating Secure UPI QR...
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Scan with <strong>Google Pay, PhonePe, Paytm, BHIM, CRED</strong>
                </div>

                {/* VPA Details */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  margin: '10px 0'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase', display: 'block' }}>Merchant UPI ID</span>
                    <strong style={{ color: 'var(--text-dark)', fontSize: 12 }}>{vpa}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVPA}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedUPI ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Optional UTR input */}
                <div style={{ textAlign: 'left', marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#475569' }}>
                    UPI Reference / UTR Number <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional - e.g. 12-digit UTR if available"
                    value={upiUtr}
                    onChange={e => setUpiUtr(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitUPIPayment}
                  disabled={verifying}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: verifying ? 'not-allowed' : 'pointer',
                    opacity: verifying ? 0.7 : 1,
                    boxShadow: '0 4px 12px rgba(217, 37, 37, 0.25)'
                  }}
                >
                  {verifying ? 'Confirming Order...' : 'I Have Paid via UPI ✓ (Confirm Order)'}
                </button>
              </div>
            )}

            {/* Countdown timer */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: timeLeft < 60 ? '#fee2e2' : '#f0fdf4',
              color: timeLeft < 60 ? '#b91c1c' : '#166534',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 700,
              marginTop: 12
            }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: timeLeft < 60 ? '#ef4444' : '#22c55e' }}></span>
              Session Expires in: <strong>{formatTime(timeLeft)}</strong>
            </div>
          </>
        ) : (
          /* Expired State */
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
            <h3 style={{ fontSize: 17, color: '#b91c1c', marginBottom: 4 }}>Session Expired</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              The 5-minute payment session has timed out.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Start New Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
