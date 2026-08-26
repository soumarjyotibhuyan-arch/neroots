import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Razorpay Standard Payment Gateway Integration Suite
 * Uses official Razorpay Node.js SDK and cryptographic HMAC-SHA256 signature verification.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TUEl7SyeNdN6Rx';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'UI53aP0pvIADyUfYxBxLBjF6';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'ne_roots_webhook_secret_2026';

// Instantiate official Razorpay SDK client
let razorpayClient = null;
try {
  if (KEY_ID && KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET
    });
  }
} catch (e) {
  console.warn('Razorpay SDK initialization warning:', e);
}

/**
 * Creates a server-side order with Razorpay
 * @param {Object} params - { amount (in paise, min 100), currency, receipt, notes }
 * @returns {Promise<Object>} - { success, orderId, amount, currency, keyId }
 */
export async function createGatewayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const numericAmount = Math.round(Number(amount));

  // Minimum amount requirement: 100 paise (₹1.00)
  if (isNaN(numericAmount) || numericAmount < 100) {
    return {
      success: false,
      error: 'Invalid order amount. Minimum amount is 100 paise (₹1.00)'
    };
  }

  const receiptId = receipt || `rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // Use official Razorpay SDK client if available
  if (razorpayClient) {
    try {
      const order = await razorpayClient.orders.create({
        amount: numericAmount,
        currency,
        receipt: receiptId,
        notes,
        payment_capture: 1
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: KEY_ID,
        receipt: order.receipt,
        raw: order
      };
    } catch (sdkError) {
      console.error('Razorpay SDK orders.create error, trying direct REST API:', sdkError);
    }
  }

  // Fallback to direct Razorpay REST API call with Basic Auth
  if (KEY_ID && KEY_SECRET) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency,
          receipt: receiptId,
          notes,
          payment_capture: 1
        })
      });

      const data = await response.json();
      if (response.ok && data.id) {
        return {
          success: true,
          orderId: data.id,
          amount: data.amount,
          currency: data.currency,
          keyId: KEY_ID,
          receipt: data.receipt,
          raw: data
        };
      } else {
        console.error('Razorpay REST API order creation error:', data);
        return {
          success: false,
          error: data.error?.description || 'Failed to create order on Razorpay gateway'
        };
      }
    } catch (apiError) {
      console.error('Razorpay REST API fetch exception:', apiError);
      return {
        success: false,
        error: apiError.message || 'Razorpay payment gateway network error'
      };
    }
  }

  return {
    success: false,
    error: 'Razorpay credentials not configured'
  };
}

/**
 * Verifies Razorpay payment signature using HMAC SHA256
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * @param {Object} params - { orderId, paymentId, signature }
 * @returns {boolean} - true if signature matches
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(payload)
      .digest('hex');

    // Use timing-safe equality check to prevent timing attacks
    if (generatedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (err) {
    console.error('Razorpay webhook signature verification error:', err);
    return false;
  }
}

/**
 * Builds an NPCI-compliant UPI deep link string for fallback/UPI direct intent
 */
export function buildUPIDeepLink({ upiId = 'neroots@upi', payeeName = 'NE Roots Assam', amount, orderId, note = 'Pickles of Assam' }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: `${note} #${orderId}`,
    tr: orderId
  });
  return `upi://pay?${params.toString()}`;
}
