import { getDB, saveDB } from '../../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit } from '../../../lib/security';
import { createGatewayOrder } from '../../../lib/paymentGateway';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Anti-fraud rate limit (max 15 payment requests per minute per IP)
  if (!checkRateLimit(req, res, { max: 15, windowMs: 60000, keyPrefix: 'pay_create' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body);
    const {
      cart,
      customerName,
      email,
      phone,
      address,
      discount = 0,
      notes = '',
      customerId = null
    } = body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Valid shopping cart items are required' });
    }

    if (!customerName || !phone || !address) {
      return res.status(400).json({ error: 'Customer name, phone, and delivery address are required' });
    }

    // -------------------------------------------------------------
    // CRITICAL: Server-Side Price & Total Calculation
    // Never trust prices submitted by client-side browser
    // -------------------------------------------------------------
    let verifiedSubtotal = 0;
    const verifiedCart = [];

    for (const item of cart) {
      const product = (db.products || []).find(p => String(p.id) === String(item.id));
      const requestedQty = Math.max(1, Math.min(20, Number(item.quantity) || 1));
      const requestedWeight = ['250g', '500g', '1kg'].includes(item.weight) ? item.weight : '250g';

      let verifiedPrice = product?.price || 249;
      if (product && product.prices && product.prices[requestedWeight]) {
        verifiedPrice = Number(product.prices[requestedWeight]);
      }

      verifiedSubtotal += verifiedPrice * requestedQty;
      verifiedCart.push({
        id: product?.id || item.id,
        name: sanitizeString(item.name || product?.name || 'Artisanal Pickle Jar', 100),
        weight: requestedWeight,
        price: verifiedPrice,
        quantity: requestedQty,
        image: sanitizeString(item.image || product?.image || '/images/mango_pickle.jpg', 255)
      });
    }

    const validDiscount = Math.max(0, Math.min(verifiedSubtotal, Number(discount) || 0));
    const validShipping = verifiedSubtotal >= 599 || validDiscount > 0 ? 0 : 49;
    const finalAmountRupees = Math.max(0, verifiedSubtotal - validDiscount + validShipping);
    const amountPaise = Math.round(finalAmountRupees * 100);

    const receiptId = `rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Payment Gateway Order with Razorpay
    const gatewayOrder = await createGatewayOrder({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        customerName: sanitizeString(customerName, 80),
        phone: sanitizeString(phone, 20),
        email: sanitizeString(email || '', 80),
        itemCount: verifiedCart.length
      }
    });

    if (!gatewayOrder.success) {
      return res.status(500).json({ error: 'Failed to initialize payment gateway order' });
    }

    // Generate internal store order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const internalOrderId = `PKL-${randomSuffix}`;

    const newOrderRecord = {
      id: internalOrderId,
      gatewayOrderId: gatewayOrder.orderId,
      receiptId,
      customerName: sanitizeString(customerName, 80),
      phone: sanitizeString(phone, 20),
      email: sanitizeString(email || '', 80),
      address: sanitizeString(address, 300),
      notes: sanitizeString(notes, 200),
      customerId: customerId || null,
      paymentMethod: 'UPI / Online Paid',
      subtotal: verifiedSubtotal,
      discount: validDiscount,
      shipping: validShipping,
      total: finalAmountRupees,
      cart: verifiedCart,
      status: 'Payment Pending',
      paymentGateway: 'Razorpay / UPI',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.orders = db.orders || [];
    db.orders.unshift(newOrderRecord);
    saveDB(db);

    return res.status(200).json({
      success: true,
      orderId: gatewayOrder.orderId,
      storeOrderId: internalOrderId,
      amount: amountPaise,
      amountRupees: finalAmountRupees,
      currency: 'INR',
      keyId: gatewayOrder.keyId,
      isSandbox: gatewayOrder.isSandbox,
      customerName: newOrderRecord.customerName,
      customerEmail: newOrderRecord.email,
      customerPhone: newOrderRecord.phone
    });
  } catch (err) {
    console.error('Create payment order error:', err);
    return res.status(500).json({ error: 'Internal server error creating payment order' });
  }
}
