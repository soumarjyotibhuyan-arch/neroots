import { getDB, saveDB } from '../../lib/db';
import { sanitizeObject, sanitizeString, checkRateLimit, validateAdminRequest } from '../../lib/security';

export default function handler(req, res) {
  const db = getDB();
  db.reviews = db.reviews || [];

  // Rate Limiting (60 requests/min for read, 10 submissions/min)
  if (!checkRateLimit(req, res, { max: 60, windowMs: 60000, keyPrefix: 'reviews_api' })) {
    return;
  }

  // -------------------------------------------------------------
  // GET: FETCH REVIEWS
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const { flavour, rating } = req.query;
    let reviews = [...db.reviews];

    if (flavour && flavour !== 'All') {
      const cleanFlavour = sanitizeString(flavour, 100).toLowerCase();
      reviews = reviews.filter(r => r.flavour?.toLowerCase().includes(cleanFlavour));
    }

    if (rating && !isNaN(Number(rating))) {
      reviews = reviews.filter(r => Number(r.rating) === Number(rating));
    }

    // Sort newest first
    reviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return res.status(200).json(reviews);
  }

  // -------------------------------------------------------------
  // POST: SUBMIT CUSTOMER REVIEW
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    if (!checkRateLimit(req, res, { max: 10, windowMs: 60000, keyPrefix: 'review_submit' })) {
      return;
    }

    const sanitizedBody = sanitizeObject(req.body);
    const { author, location, rating, flavour, title, comment } = sanitizedBody;

    if (!author || !comment || !flavour) {
      return res.status(400).json({ error: 'Author name, flavour, and review comment are required.' });
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));

    const newReview = {
      id: Date.now(),
      author: sanitizeString(author, 60),
      location: sanitizeString(location || 'India', 60),
      rating: numericRating,
      flavour: sanitizeString(flavour, 100),
      title: sanitizeString(title || 'Delicious Authentic Pickle!', 120),
      comment: sanitizeString(comment, 1000),
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true
    };

    db.reviews.unshift(newReview);
    saveDB(db);

    return res.status(201).json(newReview);
  }

  // -------------------------------------------------------------
  // DELETE: MODERATE / REMOVE REVIEW (Admin Only)
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    const adminUser = validateAdminRequest(req, res);
    if (!adminUser) return;

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Review ID required' });

    db.reviews = db.reviews.filter(r => String(r.id) !== String(id));
    saveDB(db);

    return res.status(200).json({ success: true, reviews: db.reviews });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
