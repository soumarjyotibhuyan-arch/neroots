import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from './_app';
import UserMenu from '../components/UserMenu';
import GoogleSignInBtn from '../components/GoogleSignInBtn';

export default function Reviews() {
  const { cart, cartCount, cartSubtotal, isCartOpen, setIsCartOpen, removeFromCart, showToast } = useStore();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavour, setSelectedFlavour] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [flavour, setFlavour] = useState('NE Roots Assam Bhut Jolokia & Bamboo Shoot Pickle');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const FLAVOUR_OPTIONS = [
    'NE Roots Assam Bhut Jolokia & Bamboo Shoot Pickle',
    'NE Roots Assam Kazi Nemu King Lime Pickle',
    'NE Roots Sikkim Dalle Khursani Round Cherry Chilli',
    'NE Roots Wild Hill Garlic & Mustard Seed Achaar',
    'NE Roots Sun-Cured Raw Mango & Bhoot Jolokia Fusion',
    'NE Roots Banarasi Bharwa Lal Mirch with Assam Mustard'
  ];

  useEffect(() => {
    // 1. Instant local storage hydration (zero wait for updates made in admin on this browser)
    try {
      const savedReviews = localStorage.getItem('neroots_custom_reviews');
      if (savedReviews) {
        const parsed = JSON.parse(savedReviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(parsed);
        }
      }
    } catch (e) {}

    fetchReviews();

    // 2. Real-time updates when admin edits data in another tab or same window
    const handleUpdate = () => {
      fetchReviews();
    };

    window.addEventListener('neroots_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('neroots_sync_channel');
        bc.onmessage = () => fetchReviews();
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('neroots_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) bc.close();
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        let finalReviews = data;

        try {
          const master = localStorage.getItem('neroots_master_store_backup_v2');
          if (master) {
            const parsed = JSON.parse(master);
            if (Array.isArray(parsed.reviews) && parsed.customEdits) {
              finalReviews = parsed.reviews;
            }
          }
        } catch (e) {}

        if (Array.isArray(finalReviews)) {
          setReviews(finalReviews);
          try { localStorage.setItem('neroots_custom_reviews', JSON.stringify(finalReviews)); } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim() || !flavour) {
      showToast('⚠️ Please provide your name, select a flavour, and write your review.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        author: author.trim(),
        location: location.trim() || 'India',
        rating,
        flavour,
        title: title.trim() || 'Authentic North Eastern Flavour!',
        comment: comment.trim()
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setReviews(prev => [created, ...prev]);
        showToast('🎉 Thank you! Your review has been published.');
        setIsModalOpen(false);
        setAuthor('');
        setLocation('');
        setTitle('');
        setComment('');
        setRating(5);
      } else {
        showToast('❌ Failed to publish review. Please try again.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Network error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    const matchFlavour = selectedFlavour === 'All' || r.flavour?.toLowerCase().includes(selectedFlavour.toLowerCase());
    const matchRating = selectedRating === 'All' || Number(r.rating) === Number(selectedRating);
    return matchFlavour && matchRating;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / totalReviews).toFixed(2)
    : '4.95';

  const fiveStarCount = reviews.filter(r => Number(r.rating) === 5).length;
  const fourStarCount = reviews.filter(r => Number(r.rating) === 4).length;
  const threeStarCount = reviews.filter(r => Number(r.rating) <= 3).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Customer Reviews &amp; Testimonials | NE Roots Pickles</title>
        <meta name="description" content="Read authentic, verified customer reviews of NE Roots Assam Bhut Jolokia, Kazi Nemu, and Dalle Khursani handcrafted pickles. 100% vegetarian." />
        <link rel="canonical" href="https://neroots.in/reviews" />
        <meta property="og:title" content="Customer Reviews | NE Roots (North East Roots)" />
        <meta property="og:description" content="Verified reviews for handcrafted North Eastern Indian pickles from Assam." />
        <meta property="og:image" content="/images/hero_banner.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "NE Roots Artisanal North Eastern Pickles",
              "image": "https://neroots.in/images/hero_banner.jpg",
              "description": "Authentic North Eastern Indian pickles crafted in Assam with traditional recipes.",
              "brand": {
                "@type": "Brand",
                "name": "NE Roots"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": avgRating,
                "reviewCount": totalReviews.toString(),
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
      </Head>

      {/* Indigenous Assamese Pattern Strip */}
      <div className="ne-zigzag-strip"></div>

      {/* Statutory Notification Strip */}
      <div className="top-banner">
        <div className="container">
          <div className="top-banner-content">
            <span>🌿 100% Pure Vegetarian</span>
            <span className="top-banner-fssai">FSSAI Lic. No: <strong>20326101000625</strong></span>
            <span>🚚 Free Express Shipping Above ₹599</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-logo" title="NE Roots (North East Roots)">
            <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
            <div>
              <div className="brand-name">NE Roots</div>
              <div className="brand-tagline">North East Roots • Flavours of Assam</div>
            </div>
          </Link>

          <div className="nav-actions">
            <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
              Storefront
            </Link>
            <Link href="/team" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
              Our Team
            </Link>
            <Link href="/reviews" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              Reviews ⭐
            </Link>

            {/* Google User Identity Menu */}
            <UserMenu />

            <button
              onClick={() => setIsCartOpen(true)}
              className="cart-btn"
              aria-label={`View Basket, ${cartCount} items`}
            >
              <span>🧺</span>
              <span>Basket</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Reviews Section */}
      <main className="container" style={{ flex: 1, padding: '40px 20px' }}>
        <section
          className="reviews-hero-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 28px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '36px'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff5f5', color: 'var(--primary)', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              <span>⭐</span> Verified Customer Reviews
            </div>
            <h1 style={{ fontSize: 32, margin: '0 0 12px 0', lineHeight: 1.2 }}>
              What Food Lovers Say About <span style={{ color: 'var(--primary)' }}>NE Roots</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Handcrafted in Assam with native ingredients like Ghost Peppers, GI-tagged Kazi Nemu lemons, and fermented bamboo shoot (Khorisa). See genuine feedback from customers across India.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 4px 14px rgba(230,43,43,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>✍️</span> Write a Customer Review
            </button>
          </div>

          {/* Rating Summary Card */}
          <div style={{
            background: 'var(--bg-cream)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1 }}>{avgRating}</span>
              <div>
                <div style={{ color: '#ffd147', fontSize: 18 }}>★★★★★</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Based on {totalReviews} verified experiences</div>
              </div>
            </div>

            {/* Distribution Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ width: 50, color: 'var(--text-muted)' }}>5 Star</span>
                <div style={{ flex: 1, height: 8, background: '#e0d8cc', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 100}%`, height: '100%', background: '#008738' }}></div>
                </div>
                <span style={{ width: 24, textAlign: 'right', fontWeight: 600 }}>{fiveStarCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ width: 50, color: 'var(--text-muted)' }}>4 Star</span>
                <div style={{ flex: 1, height: 8, background: '#e0d8cc', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews > 0 ? (fourStarCount / totalReviews) * 100 : 0}%`, height: '100%', background: '#ffd147' }}></div>
                </div>
                <span style={{ width: 24, textAlign: 'right', fontWeight: 600 }}>{fourStarCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ width: 50, color: 'var(--text-muted)' }}>3 Star</span>
                <div style={{ flex: 1, height: 8, background: '#e0d8cc', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${totalReviews > 0 ? (threeStarCount / totalReviews) * 100 : 0}%`, height: '100%', background: '#e62b2b' }}></div>
                </div>
                <span style={{ width: 24, textAlign: 'right', fontWeight: 600 }}>{threeStarCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedFlavour('All')}
              className={`filter-btn ${selectedFlavour === 'All' ? 'active' : ''}`}
            >
              ✨ All Flavours ({reviews.length})
            </button>
            <button
              onClick={() => setSelectedFlavour('Bhut Jolokia')}
              className={`filter-btn ${selectedFlavour === 'Bhut Jolokia' ? 'active' : ''}`}
            >
              🌶️ Bhut Jolokia &amp; Khorisa
            </button>
            <button
              onClick={() => setSelectedFlavour('Kazi Nemu')}
              className={`filter-btn ${selectedFlavour === 'Kazi Nemu' ? 'active' : ''}`}
            >
              🍋 Kazi Nemu Lime
            </button>
            <button
              onClick={() => setSelectedFlavour('Dalle Khursani')}
              className={`filter-btn ${selectedFlavour === 'Dalle Khursani' ? 'active' : ''}`}
            >
              🔥 Dalle Khursani
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter by:</span>
            <select
              value={selectedRating}
              onChange={e => setSelectedRating(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                fontSize: 13,
                background: '#fff',
                fontWeight: 600
              }}
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Loading verified reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ background: '#fff', padding: '60px 20px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
            <h3>No reviews found for this selection</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Be the first to share your experience with this flavour!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{ background: 'var(--primary)', color: '#fff', padding: '10px 24px', borderRadius: 'var(--radius-full)', marginTop: 12, fontWeight: 700 }}
            >
              Write Review
            </button>
          </div>
        ) : (
          <div className="reviews-grid" style={{ marginBottom: '50px' }}>
            {filteredReviews.map(rev => (
              <article
                key={rev.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ color: '#e62b2b', fontSize: 16, letterSpacing: 2 }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    {rev.verifiedPurchase && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#008738', background: '#eaf7ee', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✓ Verified Customer
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 16, margin: '0 0 8px 0', color: 'var(--text-dark)' }}>
                    {rev.title}
                  </h3>

                  <p style={{ fontSize: 14, color: '#4a4036', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    &quot;{rev.comment}&quot;
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
                    🏺 {rev.flavour}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span><strong>{rev.author}</strong> • {rev.location}</span>
                    <span>{rev.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Back to Shopping Callout */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '28px 32px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 40
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>Ready to experience authentic Assam flavours?</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>Orders placed today are shipped in 24 hours with express doorstep delivery.</p>
          </div>
          <Link
            href="/"
            style={{
              background: 'var(--accent-navy)',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: 14
            }}
          >
            Explore Pickle Varieties →
          </Link>
        </div>
      </main>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div
          className="responsive-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="responsive-modal-box"
            style={{ maxWidth: 540 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>Write a Customer Review</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', fontSize: 24, color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Google Authentication Status in Review Modal */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#e6f4ea', padding: '10px 14px', borderRadius: 8, marginBottom: 18, border: '1px solid #ceead6' }}>
                <img src={user.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#137333' }}>✓ Submitting as Google Verified Reviewer</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{user.name} ({user.email})</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8f9fa', padding: '12px 14px', borderRadius: 8, marginBottom: 18, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>Verified Shopper Badge</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign in with Google to earn a Verified badge</div>
                </div>
                <GoogleSignInBtn size="small" label="Sign in" />
              </div>
            )}

            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Your Rating</label>
                <div style={{ display: 'flex', gap: 8, fontSize: 28, cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      style={{ color: star <= rating ? '#e62b2b' : '#d1c7b7' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Pickle Flavour *</label>
                <select
                  value={flavour}
                  onChange={e => setFlavour(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                  required
                >
                  {FLAVOUR_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Your Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Manas Pratim"
                    value={author || (user?.name || '')}
                    onChange={e => setAuthor(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>City / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Guwahati, Assam"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Unmatched Khorisa pungency and authentic aroma!"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Detailed Experience &amp; Taste Notes *</label>
                <textarea
                  rows={4}
                  placeholder="Share how you paired the pickle (with dal-rice, parathas, etc.) and what you loved most about the aroma and texture..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, resize: 'vertical' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting Review...' : 'Publish My Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="store-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="brand-logo" style={{ marginBottom: 12 }}>
                <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
                <div className="brand-name" style={{ color: '#ffd147' }}>NE Roots</div>
              </div>
              <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.6 }}>
                Vibrant FMCG brand rooted in Assam, celebrating authentic North Eastern Indian pickles crafted with traditional recipes.
              </p>
              <div style={{ marginTop: 12, fontSize: 12, color: '#ffd147' }}>
                FSSAI Lic. No: <strong>20326101000625</strong>
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link href="/">Our Pickle Catalog</Link></li>
                <li><Link href="/team">About Our Team &amp; Heritage</Link></li>
                <li><Link href="/reviews">Customer Reviews</Link></li>
                <li><Link href="/checkout">Express Checkout</Link></li>
                <li><Link href="/admin">Google Admin Portal</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Assam Kitchen &amp; Care</h4>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                📍 R.G. Baruah Road, Guwahati, Assam - 781024<br />
                📞 +91 94350 12345 / +91 88110 54321<br />
                ✉️ care@neroots.in
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} NE Roots (North East Roots). All Rights Reserved.</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/refund-policy">Return Policy</Link>
              <Link href="/grievance">Grievance Redressal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
