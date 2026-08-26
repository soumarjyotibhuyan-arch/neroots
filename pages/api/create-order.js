import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit } from '../../lib/security';
import { createGatewayOrder } from '../../lib/paymentGateway';

export default async function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Anti-abuse rate limit
  if (!checkRateLimit(req, res, { max: 30, windowMs: 60000, keyPrefix: 'create_order_api' })) {
    return;
  }

  try {
    const db = getDB();
    const body = sanitizeObject(req.body) || {};
    const {
      amount,
      currency = 'INR',
      receipt,
      notes = {},
      cart,
      customerName = 'Valued Customer',
      email = '',
      phone = '',
      address = '',
      discount = 0,
      customerId = null
    } = body;

    let finalAmountPaise = 0;
    let verifiedCart = [];
    let verifiedSubtotal = 0;
    let validDiscount = 0;
    let validShipping = 0;

    // Case 1: Full cart checkout with server-side price verification
    if (cart && Array.isArray(cart) && cart.length > 0) {
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

      validDiscount = Math.max(0, Math.min(verifiedSubtotal, Number(discount) || 0));
      validShipping = verifiedSubtotal >= 599 || validDiscount > 0 ? 0 : 49;
      const finalAmountRupees = Math.max(0, verifiedSubtotal - validDiscount + validShipping);
      finalAmountPaise = Math.round(finalAmountRupees * 100);
    } else if (amount !== undefined && !isNaN(Number(amount))) {
      // Case 2: Standard amount passed directly (in paise or rupees)
      const parsedAmount = Number(amount);
      // If amount < 100, assume it was provided in rupees unless specified >= 100 paise
      finalAmountPaise = parsedAmount >= 100 ? Math.round(parsedAmount) : Math.round(parsedAmount * 100);
    } else {
      return res.status(400).json({
        error: 'Amount or valid cart items are required'
      });
    }

    // Validate minimum amount requirement (100 paise = ₹1.00)
    if (finalAmountPaise < 100) {
      return res.status(400).json({
        error: 'Order amount must be at least 100 paise (₹1.00)'
      });
    }

    const receiptId = receipt || `rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Call Razorpay API
    const gatewayOrder = await createGatewayOrder({
      amount: finalAmountPaise,
      currency,
      receipt: receiptId,
      notes: {
        customerName: sanitizeString(customerName, 80),
        phone: sanitizeString(phone, 20),
        email: sanitizeString(email, 80),
        ...notes
      }
    });

    if (!gatewayOrder.success) {
      return res.status(500).json({
        error: gatewayOrder.error || 'Failed to create order with Razorpay'
      });
    }

    // Save order record to store DB
    const internalOrderId = `PKL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderRecord = {
      id: internalOrderId,
      gatewayOrderId: gatewayOrder.orderId,
      receiptId,
      customerName: sanitizeString(customerName, 80),
      phone: sanitizeString(phone, 20),
      email: sanitizeString(email, 80),
      address: sanitizeString(address, 300),
      notes: sanitizeString(notes?.customerNotes || '', 200),
      customerId: customerId || null,
      paymentMethod: 'UPI / Online Paid',
      subtotal: verifiedSubtotal || Math.round(finalAmountPaise / 100),
      discount: validDiscount,
      shipping: validShipping,
      total: Math.round(finalAmountPaise / 100),
      cart: verifiedCart,
      status: 'Payment Pending',
      paymentGateway: 'Razorpay Standard Checkout',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    db.orders = db.orders || [];
    db.orders.unshift(newOrderRecord);
    saveDB(db);

    return res.status(200).json({
      success: true,
      order_id: gatewayOrder.orderId,
      orderId: gatewayOrder.orderId,
      amount: gatewayOrder.amount,
      amountRupees: Math.round(gatewayOrder.amount / 100),
      currency: gatewayOrder.currency || 'INR',
      key_id: gatewayOrder.keyId,
      keyId: gatewayOrder.keyId,
      receipt: gatewayOrder.receipt,
      storeOrderId: internalOrderId,
      customerName: newOrderRecord.customerName,
      customerEmail: newOrderRecord.email,
      customerPhone: newOrderRecord.phone
    });
  } catch (err) {
    console.error('Error in /api/create-order:', err);
    return res.status(500).json({
      error: 'Internal server error creating order'
    });
  }
}
