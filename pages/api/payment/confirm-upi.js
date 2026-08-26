import { getDB, saveDB } from '../../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit } from '../../../lib/security';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Rate limiting
  if (!checkRateLimit(req, res, { max: 20, windowMs: 60000, keyPrefix: 'confirm_upi_api' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body) || {};
    const {
      storeOrderId,
      orderId,
      gatewayOrderId,
      upiUtr,
      customerUPI,
      customerName,
      phone,
      amountRupees
    } = body;

    const targetOrderId = sanitizeString(storeOrderId || orderId || '', 30);
    const cleanUtr = sanitizeString(upiUtr || 'Self-Confirmed via UPI App', 50);
    const cleanCustomerUPI = sanitizeString(customerUPI || '', 80);

    db.orders = db.orders || [];
    let orderIndex = db.orders.findIndex(
      o => (targetOrderId && String(o.id) === targetOrderId) ||
           (gatewayOrderId && String(o.gatewayOrderId) === String(gatewayOrderId))
    );

    if (orderIndex !== -1) {
      db.orders[orderIndex].status = 'Pending Verification (UPI Paid)';
      db.orders[orderIndex].paymentMethod = 'Direct UPI Transfer';
      db.orders[orderIndex].paymentGateway = 'Direct Merchant UPI';
      db.orders[orderIndex].upiUtr = cleanUtr;
      db.orders[orderIndex].customerUPI = cleanCustomerUPI;
      db.orders[orderIndex].paidAt = new Date().toISOString();
      saveDB(db);

      return res.status(200).json({
        success: true,
        message: 'UPI payment submitted for verification',
        order: db.orders[orderIndex]
      });
    }

    // If order was not initialized yet, create it directly
    const fallbackOrderId = targetOrderId || `PKL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: fallbackOrderId,
      gatewayOrderId: gatewayOrderId || `upi_${Date.now()}`,
      customerName: sanitizeString(customerName || 'Valued Customer', 80),
      phone: sanitizeString(phone || '', 20),
      total: Number(amountRupees) || 0,
      status: 'Pending Verification (UPI Paid)',
      paymentMethod: 'Direct UPI Transfer',
      paymentGateway: 'Direct Merchant UPI',
      upiUtr: cleanUtr,
      customerUPI: cleanCustomerUPI,
      cart: [],
      paidAt: new Date().toISOString(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.orders.unshift(newOrder);
    saveDB(db);

    return res.status(200).json({
      success: true,
      message: 'UPI payment submitted successfully',
      order: newOrder
    });
  } catch (err) {
    console.error('Error in /api/payment/confirm-upi:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm UPI transaction'
    });
  }
}
