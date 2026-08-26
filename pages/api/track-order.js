import { getDB } from '../../lib/db';
import { sanitizeString, checkRateLimit } from '../../lib/security';

export default function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Rate Limiting (120 requests per minute)
  if (!checkRateLimit(req, res, { max: 120, windowMs: 60000, keyPrefix: 'track_order_api' })) {
    return;
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required to track order status.' });
    }

    const cleanId = sanitizeString(String(id).trim(), 40);
    const db = getDB();
    const order = (db.orders || []).find(
      o => String(o.id).toLowerCase() === cleanId.toLowerCase() ||
           (o.gatewayOrderId && String(o.gatewayOrderId).toLowerCase() === cleanId.toLowerCase()) ||
           (o.receiptId && String(o.receiptId).toLowerCase() === cleanId.toLowerCase())
    );

    if (!order) {
      return res.status(404).json({ error: 'No order found matching the provided ID.' });
    }

    // Mask customer details (PII protection)
    const maskName = (name) => {
      if (!name) return 'Valued Customer';
      const parts = name.split(' ');
      return parts.map(p => p.slice(0, 1) + '*'.repeat(Math.max(0, p.length - 1))).join(' ');
    };

    const maskPhone = (phone) => {
      if (!phone) return '';
      const cleanPhone = phone.replace(/\s+/g, '');
      if (cleanPhone.length <= 4) return '****';
      return '*****' + cleanPhone.slice(-4);
    };

    const sanitizedOrder = {
      id: order.id,
      customerName: maskName(order.customerName),
      phone: maskPhone(order.phone),
      total: order.total,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      paymentMethod: order.paymentMethod,
      paymentGateway: order.paymentGateway,
      status: order.status,
      date: order.date,
      createdAt: order.createdAt,
      cart: (order.cart || []).map(item => ({
        name: item.name,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))
    };

    return res.status(200).json({ success: true, order: sanitizedOrder });
  } catch (err) {
    console.error('Error tracking order:', err);
    return res.status(500).json({ error: 'Internal server error tracking order status.' });
  }
}
