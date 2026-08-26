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

  if (!checkRateLimit(req, res, { max: 20, windowMs: 60000, keyPrefix: 'confirm_card_api' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body) || {};
    const {
      storeOrderId,
      orderId,
      gatewayOrderId,
      paymentType = 'Card', // 'Card' | 'NetBanking'
      cardLast4,
      cardBrand,
      bankName,
      customerName,
      phone,
      amountRupees
    } = body;

    const targetOrderId = sanitizeString(storeOrderId || orderId || '', 30);
    const cleanPaymentType = sanitizeString(paymentType, 30);
    const cleanBank = sanitizeString(bankName || '', 50);
    const cleanLast4 = sanitizeString(cardLast4 || 'XXXX', 10);
    const cleanBrand = sanitizeString(cardBrand || 'Card', 20);

    db.orders = db.orders || [];
    let orderIndex = db.orders.findIndex(
      o => (targetOrderId && String(o.id) === targetOrderId) ||
           (gatewayOrderId && String(o.gatewayOrderId) === String(gatewayOrderId))
    );

    const paymentDetailsStr = cleanPaymentType === 'NetBanking'
      ? `Net Banking (${cleanBank})`
      : `${cleanBrand} Card (ending in ${cleanLast4})`;

    if (orderIndex !== -1) {
      db.orders[orderIndex].status = 'Confirmed (Online Paid)';
      db.orders[orderIndex].paymentMethod = paymentDetailsStr;
      db.orders[orderIndex].paymentGateway = cleanPaymentType === 'NetBanking' ? 'E-Banking Gateway' : 'Card Gateway';
      db.orders[orderIndex].paidAt = new Date().toISOString();
      saveDB(db);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        order: db.orders[orderIndex]
      });
    }

    const fallbackOrderId = targetOrderId || `PKL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: fallbackOrderId,
      gatewayOrderId: gatewayOrderId || `pay_${Date.now()}`,
      customerName: sanitizeString(customerName || 'Valued Customer', 80),
      phone: sanitizeString(phone || '', 20),
      total: Number(amountRupees) || 0,
      status: 'Confirmed (Online Paid)',
      paymentMethod: paymentDetailsStr,
      paymentGateway: cleanPaymentType === 'NetBanking' ? 'E-Banking Gateway' : 'Card Gateway',
      cart: [],
      paidAt: new Date().toISOString(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.orders.unshift(newOrder);
    saveDB(db);

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      order: newOrder
    });
  } catch (err) {
    console.error('Error in /api/payment/confirm-card-netbanking:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm transaction'
    });
  }
}
