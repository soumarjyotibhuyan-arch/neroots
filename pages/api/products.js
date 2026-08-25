import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit, validateAdminRequest } from '../../lib/security';

export default function handler(req, res) {
  // 1. Rate Limiting Check
  if (!checkRateLimit(req, res, { max: 60, windowMs: 60000, keyPrefix: 'products_api' })) {
    return;
  }

  const db = getDB();

  // -------------------------------------------------------------
  // PUBLIC READ: GET PRODUCTS
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const { category, search, id } = req.query;
    let products = [...(db.products || [])];

    if (id) {
      const cleanId = sanitizeString(String(id), 20);
      const product = products.find(p => String(p.id) === cleanId);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json(product);
    }

    if (category && category !== 'All') {
      const cleanCat = sanitizeString(category, 50).toLowerCase();
      products = products.filter(p => p.category?.toLowerCase() === cleanCat);
    }

    if (search) {
      const q = sanitizeString(search, 100).toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.origin?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json(products);
  }

  // -------------------------------------------------------------
  // ADMIN PROTECTED WRITE: POST / PUT / DELETE
  // -------------------------------------------------------------
  const adminUser = validateAdminRequest(req, res);
  if (!adminUser) {
    return; // Response already sent with 401 Unauthorized
  }

  if (req.method === 'POST') {
    const sanitizedBody = sanitizeObject(req.body);
    const { name, shortName, category, price, prices, description, spiceLevel, image, origin, ingredients, badge } = sanitizedBody;

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const basePrice = Number(price);
    if (isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    const newProduct = {
      id: Date.now(),
      name: sanitizeString(name, 120),
      shortName: sanitizeString(shortName || name, 80),
      category: sanitizeString(category || 'Spicy', 50),
      price: basePrice,
      prices: prices || {
        "250g": basePrice,
        "500g": Math.round(basePrice * 1.8),
        "1kg": Math.round(basePrice * 3.3)
      },
      description: sanitizeString(description || '', 1000),
      spiceLevel: sanitizeString(spiceLevel || 'Medium', 30),
      spiceRating: spiceLevel === 'Mild' ? 1 : spiceLevel === 'Medium' ? 2 : spiceLevel === 'Hot' ? 3 : 4,
      image: sanitizeString(image || '/images/mango_pickle.jpg', 255),
      badge: sanitizeString(badge || 'Handcrafted 🏺', 50),
      origin: sanitizeString(origin || 'Traditional Kitchen', 80),
      ingredients: Array.isArray(ingredients)
        ? ingredients.map(i => sanitizeString(String(i), 60))
        : (ingredients ? ingredients.split(',').map(s => sanitizeString(s.trim(), 60)) : ["Cold-Pressed Mustard Oil", "Traditional Spices", "Rock Salt"]),
      rating: 5.0,
      reviewCount: 1,
      inStock: true,
      featured: false
    };

    db.products.unshift(newProduct);
    saveDB(db);
    return res.status(201).json(newProduct);
  }

  if (req.method === 'PUT') {
    const sanitizedBody = sanitizeObject(req.body);
    const { id, ...updates } = sanitizedBody;
    if (!id) return res.status(400).json({ error: 'Product ID required' });

    const index = db.products.findIndex(p => String(p.id) === String(id));
    if (index === -1) return res.status(404).json({ error: 'Product not found' });

    db.products[index] = { ...db.products[index], ...updates };
    saveDB(db);
    return res.status(200).json(db.products[index]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Product ID required' });

    const cleanId = sanitizeString(String(id), 30);
    db.products = db.products.filter(p => String(p.id) !== cleanId);
    saveDB(db);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
