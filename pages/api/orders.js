import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit, validateAdminRequest } from '../../lib/security';

export default function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const db = getDB();

  // -------------------------------------------------------------
  // ADMIN READ & STATUS UPDATE: GET & PATCH
  // (Protected to prevent Customer PII data leaks)
  // -------------------------------------------------------------
  if (req.method === 'GET' || req.method === 'PATCH') {
    const adminUser = validateAdminRequest(req, res);
    if (!adminUser) {
      return; // 401 Unauthorized already returned
    }

    if (req.method === 'GET') {
      const orders = [...(db.orders || [])].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      return res.status(200).json(orders);
    }

    if (req.method === 'PATCH') {
      const sanitizedBody = sanitizeObject(req.body);
      const { id, status } = sanitizedBody;

      if (!id || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
      }

      const cleanId = sanitizeString(String(id), 30);
      const cleanStatus = sanitizeString(String(status), 50);

      const index = db.orders.findIndex(o => String(o.id) === cleanId);
      if (index === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.orders[index].status = cleanStatus;
      saveDB(db);
      return res.status(200).json(db.orders[index]);
    }
  }

  // -------------------------------------------------------------
  // CUSTOMER ORDER CREATION: POST
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    // Anti-Spam / Anti-Flood Rate Limiting for checkout
    if (!checkRateLimit(req, res, { max: 10, windowMs: 60000, keyPrefix: 'order_create' })) {
      return;
    }

    const sanitizedBody = sanitizeObject(req.body);
    const {
      customerName,
      phone,
      email,
      address,
      cart,
      paymentMethod,
      notes,
      discount = 0
    } = sanitizedBody;

    if (!customerName || !address || !cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Customer name, address, and valid cart items are required' });
    }

    // Server-Side Price Integrity Verification (Prevents Client Price Tampering Attack)
    let validatedSubtotal = 0;
    const validatedCart = [];

    for (const item of cart) {
      const product = db.products.find(p => String(p.id) === String(item.id));
      const requestedQty = Math.max(1, Math.min(20, Number(item.quantity) || 1));
      const requestedWeight = ['250g', '500g', '1kg'].includes(item.weight) ? item.weight : '250g';

      let verifiedPrice = product?.price || 249;
      if (product && product.prices && product.prices[requestedWeight]) {
        verifiedPrice = product.prices[requestedWeight];
      }

      validatedSubtotal += verifiedPrice * requestedQty;
      validatedCart.push({
        id: product?.id || item.id,
        name: sanitizeString(item.name || product?.name || 'Pickle Jar', 100),
        weight: requestedWeight,
        price: verifiedPrice,
        quantity: requestedQty,
        image: sanitizeString(item.image || product?.image || '/images/mango_pickle.jpg', 255)
      });
    }

    const validDiscount = Math.max(0, Math.min(validatedSubtotal, Number(discount) || 0));
    const validShipping = validatedSubtotal >= 599 || validDiscount > 0 ? 0 : 49;
    const calculatedTotal = Math.max(0, validatedSubtotal - validDiscount + validShipping);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PKL-${randomSuffix}`;

    const newOrder = {
      id: orderId,
      customerName: sanitizeString(customerName, 80),
      phone: sanitizeString(phone, 20),
      email: sanitizeString(email, 80),
      address: sanitizeString(address, 300),
      notes: sanitizeString(notes || '', 200),
      paymentMethod: paymentMethod === 'UPI / Online Paid' ? 'UPI / Online Paid' : 'Cash on Delivery',
      subtotal: validatedSubtotal,
      discount: validDiscount,
      shipping: validShipping,
      total: calculatedTotal,
      cart: validatedCart,
      status: paymentMethod === 'UPI / Online Paid' ? 'Confirmed (Online Paid)' : 'Pending (Cash on Delivery)',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.orders = db.orders || [];
    db.orders.unshift(newOrder);
    saveDB(db);

    return res.status(201).json(newOrder);
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
