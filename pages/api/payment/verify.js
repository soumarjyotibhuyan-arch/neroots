import { getDB, saveDB } from '../../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit } from '../../../lib/security';
import { verifyPaymentSignature } from '../../../lib/paymentGateway';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!checkRateLimit(req, res, { max: 30, windowMs: 60000, keyPrefix: 'pay_verify' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      storeOrderId
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Order ID and Payment ID are required for verification' });
    }

    // Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      console.warn(`Payment signature verification failed for order ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Transaction could not be verified.'
      });
    }

    // Locate order in database by gatewayOrderId or storeOrderId
    const cleanStoreOrderId = sanitizeString(storeOrderId || '', 30);
    const cleanGatewayOrderId = sanitizeString(razorpay_order_id, 80);

    let orderIndex = db.orders.findIndex(
      o => (cleanStoreOrderId && String(o.id) === cleanStoreOrderId) ||
           (o.gatewayOrderId && String(o.gatewayOrderId) === cleanGatewayOrderId)
    );

    if (orderIndex === -1) {
      // Create fallback order record if not found
      const fallbackOrder = {
        id: cleanStoreOrderId || `PKL-${Math.floor(1000 + Math.random() * 9000)}`,
        gatewayOrderId: cleanGatewayOrderId,
        paymentId: sanitizeString(razorpay_payment_id, 80),
        status: 'Confirmed (Online Paid)',
        paymentMethod: 'UPI / Online Paid',
        paymentGateway: 'Razorpay / UPI',
        paidAt: new Date().toISOString(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      db.orders.unshift(fallbackOrder);
      saveDB(db);
      return res.status(200).json({ success: true, order: fallbackOrder });
    }

    // Update order status to Confirmed (Online Paid)
    db.orders[orderIndex].status = 'Confirmed (Online Paid)';
    db.orders[orderIndex].paymentId = sanitizeString(razorpay_payment_id, 80);
    db.orders[orderIndex].paymentSignature = sanitizeString(razorpay_signature || '', 128);
    db.orders[orderIndex].paidAt = new Date().toISOString();
    db.orders[orderIndex].paymentGateway = 'Razorpay / UPI';

    saveDB(db);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: db.orders[orderIndex]
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Internal server error verifying payment' });
  }
}
