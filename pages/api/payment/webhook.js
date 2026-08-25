import { getDB, saveDB } from '../../../lib/db';
import { sanitizeString } from '../../../lib/security';
import { verifyWebhookSignature } from '../../../lib/paymentGateway';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Verify webhook signature if secret is configured and signature is provided
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('Unauthorized webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const gatewayOrderId = orderEntity?.id || paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    console.log(`Received Payment Gateway Webhook event: ${event} for order: ${gatewayOrderId}`);

    const db = getDB();
    db.orders = db.orders || [];

    if (event === 'payment.captured' || event === 'order.paid') {
      if (gatewayOrderId) {
        const orderIdx = db.orders.findIndex(o => o.gatewayOrderId === gatewayOrderId);
        if (orderIdx > -1) {
          db.orders[orderIdx].status = 'Confirmed (Online Paid)';
          if (paymentId) db.orders[orderIdx].paymentId = sanitizeString(paymentId, 80);
          db.orders[orderIdx].paidAt = new Date().toISOString();
          db.orders[orderIdx].paymentGateway = 'Razorpay / Webhook';
          saveDB(db);
          console.log(`Order ${db.orders[orderIdx].id} successfully marked as Confirmed via Webhook`);
        }
      }
    } else if (event === 'payment.failed') {
      if (gatewayOrderId) {
        const orderIdx = db.orders.findIndex(o => o.gatewayOrderId === gatewayOrderId);
        if (orderIdx > -1 && db.orders[orderIdx].status === 'Payment Pending') {
          db.orders[orderIdx].status = 'Payment Failed';
          db.orders[orderIdx].paymentError = sanitizeString(paymentEntity?.error_description || 'Payment authorization failed', 200);
          saveDB(db);
        }
      }
    }

    // Acknowledge receipt to the payment gateway
    return res.status(200).json({ status: 'ok', eventReceived: event });
  } catch (err) {
    console.error('Payment webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing exception' });
  }
}
