import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit } from '../../lib/security';
import { verifyPaymentSignature } from '../../lib/paymentGateway';

export default async function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Rate limiting
  if (!checkRateLimit(req, res, { max: 30, windowMs: 60000, keyPrefix: 'verify_payment_api' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body) || {};
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
      storeOrderId
    } = body;

    const orderId = razorpay_order_id || order_id;
    const paymentId = razorpay_payment_id || payment_id;
    const paymentSignature = razorpay_signature || signature;

    // Validation: Missing fields check
    if (!orderId || !paymentId || !paymentSignature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_id, payment_id, and signature are required'
      });
    }

    // Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: paymentSignature
    });

    if (!isValid) {
      console.warn(`[Razorpay Security] Signature mismatch for Order: ${orderId}, Payment: ${paymentId}`);
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Signature mismatch'
      });
    }

    // Locate and update order in database
    const cleanStoreOrderId = sanitizeString(storeOrderId || '', 30);
    const cleanGatewayOrderId = sanitizeString(orderId, 80);

    db.orders = db.orders || [];
    let orderIndex = db.orders.findIndex(
      o => (cleanStoreOrderId && String(o.id) === cleanStoreOrderId) ||
           (o.gatewayOrderId && String(o.gatewayOrderId) === cleanGatewayOrderId)
    );

    if (orderIndex === -1) {
      const newConfirmedOrder = {
        id: cleanStoreOrderId || `PKL-${Math.floor(1000 + Math.random() * 9000)}`,
        gatewayOrderId: cleanGatewayOrderId,
        paymentId: sanitizeString(paymentId, 80),
        paymentSignature: sanitizeString(paymentSignature, 128),
        status: 'Confirmed (Online Paid)',
        paymentMethod: 'Razorpay Standard Checkout',
        paymentGateway: 'Razorpay',
        paidAt: new Date().toISOString(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      db.orders.unshift(newConfirmedOrder);
      saveDB(db);
      return res.status(200).json({
        success: true,
        message: 'Payment verified and order created successfully',
        order: newConfirmedOrder
      });
    }

    // Update existing order status
    db.orders[orderIndex].status = 'Confirmed (Online Paid)';
    db.orders[orderIndex].paymentId = sanitizeString(paymentId, 80);
    db.orders[orderIndex].paymentSignature = sanitizeString(paymentSignature, 128);
    db.orders[orderIndex].paidAt = new Date().toISOString();
    db.orders[orderIndex].paymentGateway = 'Razorpay Standard Checkout';

    saveDB(db);

    return res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully',
      order: db.orders[orderIndex]
    });
  } catch (err) {
    console.error('Error in /api/verify-payment:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error verifying payment'
    });
  }
}
