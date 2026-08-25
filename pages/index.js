import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from './_app';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeights, setSelectedWeights] = useState({});

  const {
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    showToast
  } = useStore();

  const categories = ['All', 'Fiery North East', 'Tangy & Aromatic', 'Garlic & Herbs', 'Sweet & Tangy', 'Regional Specials'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);

      const initialWeights = {};
      data.forEach(p => {
        initialWeights[p.id] = '250g';
      });
      setSelectedWeights(initialWeights);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (productId, weight) => {
    setSelectedWeights(prev => ({
      ...prev,
      [productId]: weight
    }));
  };

  const handleAddToCart = (product) => {
    const weight = selectedWeights[product.id] || '250g';
    const price = product.prices ? product.prices[weight] : product.price;

    addToCart({
      id: product.id,
      name: product.name,
      shortName: product.shortName || product.name,
      price: price,
      weight: weight,
      image: product.image,
      spiceLevel: product.spiceLevel
    });

    showToast(`🌶️ Added ${product.shortName || product.name} (${weight}) to basket!`);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Structured Data Schema for Google Rich Search Results
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://neroots.in/#organization",
        "name": "NE Roots (North East Roots)",
        "url": "https://neroots.in",
        "logo": "https://neroots.in/images/ne_roots_logo.jpg",
        "description": "A vibrant FMCG brand rooted in the heart of Assam, dedicated to bringing authentic North Eastern Indian pickles to your table.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "G.S. Road",
          "addressLocality": "Guwahati",
          "addressRegion": "Assam",
          "postalCode": "781001",
          "addressCountry": "IN"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-98765-43210",
          "contactType": "customer service",
          "email": "contact@neroots.in",
          "areaServed": "IN",
          "availableLanguage": ["English", "Assamese", "Hindi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://neroots.in/#website",
        "url": "https://neroots.in",
        "name": "NE Roots | Authentic North Eastern Pickles",
        "publisher": {
          "@id": "https://neroots.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://neroots.in/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>NE Roots | Authentic North Eastern Pickles • Handcrafted in Assam</title>
        <meta name="description" content="NE Roots (North East Roots) is an artisanal FMCG brand rooted in Assam, bringing authentic flavours of Bhut Jolokia ghost peppers, GI-tagged Assam Kazi Nemu lemons, and fermented bamboo shoot (khorisa) pickles to your table." />
        <meta name="keywords" content="NE Roots, North East Roots, Assam Pickles, Bhut Jolokia, Ghost Pepper Pickle, Kazi Nemu, Dalle Khursani, Khorisa, Assam Achaar, Handcrafted Indian Pickles, FSSAI 20326101000625" />
        <link rel="canonical" href="https://neroots.in/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://neroots.in/" />
        <meta property="og:title" content="NE Roots | Authentic North Eastern Pickles Handcrafted in Assam" />
        <meta property="og:description" content="Celebrate the bold, soulful flavours of North East India. Handcrafted pickles with GI-tagged Kazi Nemu lemons, Bhut Jolokia, and bamboo shoots." />
        <meta property="og:image" content="https://neroots.in/images/hero_banner.jpg" />
        <meta property="og:site_name" content="NE Roots" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NE Roots | Artisanal North Eastern Pickles" />
        <meta name="twitter:description" content="Authentic Assam Bhut Jolokia, Kazi Nemu, and Dalle Khursani pickles from Assam to your doorstep." />
        <meta name="twitter:image" content="https://neroots.in/images/hero_banner.jpg" />

        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      {/* 1. Indigenous Chevron Brand Strip */}
      <div className="ne-zigzag-strip"></div>

      {/* 2. Statutory E-Commerce Compliance & Brand Bar */}
      <div className="compliance-bar">
        <div className="container compliance-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="veg-icon"><span className="veg-icon-dot"></span></span>
            <span>🏛️ <strong>FSSAI Lic. No: 20326101000625</strong> • 100% Pure Vegetarian • No Artificial Chemicals</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>📍 <strong>Origin:</strong> Handcrafted in Assam 🇮🇳</span>
            <span>🚚 Free Express Shipping Above ₹599</span>
          </div>
        </div>
      </div>

      {/* 3. Main Store Navbar */}
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-logo" title="NE Roots (North East Roots)">
            <img
              src="/images/ne_roots_logo.jpg"
              alt="NE Roots Official Brand Logo"
              className="brand-logo-img"
            />
            <div>
              <div className="brand-name">NE Roots</div>
              <div className="brand-tagline">North East Roots • Flavours of Assam</div>
            </div>
          </Link>

          <div className="nav-actions">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search Bhut Jolokia, Kazi Nemu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 16px 8px 36px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  fontSize: 13,
                  width: 240,
                  background: 'var(--bg-cream)'
                }}
              />
              <span style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', fontSize: 13 }}>🔍</span>
            </div>

            <Link
              href="/team"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-dark)',
                padding: '8px 12px'
              }}
            >
              👥 Our Team
            </Link>

            <Link
              href="/reviews"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-dark)',
                padding: '8px 12px'
              }}
            >
              ⭐ Reviews
            </Link>

            <Link
              href="/admin"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent-navy)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🔒</span> Admin
            </Link>

            <button onClick={() => setIsCartOpen(true)} className="cart-btn" aria-label="View shopping basket">
              <span>🧺 Basket</span>
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 4. Hero Showcase Section */}
      <main className="container" style={{ flex: 1 }}>
        <section className="hero-section">
          <div className="hero-backdrop"></div>
          <div className="hero-content">
            <div className="hero-pill">
              <span className="veg-icon" style={{ width: 12, height: 12 }}><span className="veg-icon-dot" style={{ width: 5, height: 5 }}></span></span>
              <span>Authentic North Eastern FMCG Brand</span>
            </div>
            <h1 className="hero-title">
              The Bold, Soulful Flavours of <span>North East India</span>
            </h1>
            <p className="hero-desc">
              <strong>NE Roots (North East Roots)</strong> is a vibrant FMCG brand rooted in the heart of Assam, dedicated to bringing the authentic, rich, and diverse flavours of North Eastern Indian pickles to your table. Specializing exclusively in North Eastern Indian flavours, our pickles are crafted using traditional recipes and locally sourced ingredients.
            </p>
            <div className="hero-badges">
              <div className="hero-badge-item">
                <span>🌿</span> Exclusively North Eastern Flavours
              </div>
              <div className="hero-badge-item">
                <span>🏺</span> Rooted in the Heart of Assam
              </div>
              <div className="hero-badge-item">
                <span>💛</span> Supporting Local Agriculture
              </div>
            </div>
          </div>
        </section>

        {/* 5. Brand Promise Quote Strip from Official Label */}
        <section style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '24px 32px',
          border: '1px solid var(--border-color)',
          marginBottom: '36px',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1, marginBottom: 4 }}>
              Our Promise
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              &quot;We promise a bold, flavourful experience that celebrates the region&apos;s distinct spices and ingredients, connecting food lovers to the vibrant culture of North East India.&quot;
            </p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-navy)', letterSpacing: 1, marginBottom: 4 }}>
              Heritage &amp; Freshness
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
              &quot;We capture the unique culinary heritage of the North East, offering a taste of home and tradition in every jar. Primarily operating within Assam, we ensure freshness and authenticity while supporting local communities.&quot;
            </p>
          </div>
        </section>

        {/* 6. Category Filter Buttons */}
        <div className="filter-tabs" role="tablist" aria-label="Pickle categories">
          {categories.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat === 'Fiery North East' ? '🌶️ Fiery North East' :
               cat === 'Tangy & Aromatic' ? '🍋 Tangy & Aromatic' :
               cat === 'Garlic & Herbs' ? '🧄 Garlic & Herbs' :
               cat === 'Sweet & Tangy' ? '🍯 Sweet & Tangy' :
               cat === 'Regional Specials' ? '🏺 Regional Specials' : '✨ All NE Pickles'}
            </button>
          ))}
        </div>

        {/* 7. Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>Curating Assam&apos;s finest artisanal pickle jars...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 'var(--radius-md)' }}>
            <h3>No pickles found matching &quot;{searchQuery}&quot;</h3>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              style={{ marginTop: 12, background: 'var(--primary)', color: '#fff', padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const currentWeight = selectedWeights[product.id] || '250g';
              const currentPrice = product.prices ? product.prices[currentWeight] : product.price;

              return (
                <article key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img
                      src={product.image || '/images/mango_pickle.jpg'}
                      alt={`${product.name} - Handcrafted by NE Roots, Assam`}
                      className="product-image"
                      loading="lazy"
                    />
                    <span className="product-badge">{product.badge || 'Handcrafted 🏺'}</span>
                    <span className="product-origin">📍 {product.origin}</span>
                  </div>

                  <div className="product-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="veg-icon"><span className="veg-icon-dot"></span></span>
                        <span className="product-category">{product.category}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-spice)' }}>
                        {'🌶️'.repeat(product.spiceRating || 2)} {product.spiceLevel}
                      </span>
                    </div>

                    <h2 className="product-title">{product.name}</h2>
                    <p className="product-desc">{product.description}</p>

                    {/* Weight Selection Buttons */}
                    <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Select Jar Size (Net Quantity):
                    </div>
                    <div className="weight-selector">
                      {['250g', '500g', '1kg'].map(w => (
                        <button
                          key={w}
                          onClick={() => handleWeightChange(product.id, w)}
                          className={`weight-btn ${currentWeight === w ? 'selected' : ''}`}
                        >
                          {w} {product.prices && `(₹${product.prices[w]})`}
                        </button>
                      ))}
                    </div>

                    {/* Pricing & Add to Cart */}
                    <div className="product-footer">
                      <div>
                        <span className="product-price-label">Price (Incl. all taxes / GST)</span>
                        <div className="product-price">₹{currentPrice}</div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="add-cart-btn"
                        aria-label={`Add ${product.name} to basket`}
                      >
                        + Add to Basket
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 8. Official Brand Label & Packaging Showcase */}
        <section style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid #ffd147',
          padding: '36px 32px',
          margin: '40px 0 50px 0',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 24px auto' }}>
            <span style={{ background: '#fff5f5', color: 'var(--primary)', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Official Packaging Quality
            </span>
            <h2 style={{ fontSize: 26, marginTop: 8, marginBottom: 8 }}>Authentic NE Roots Brand Packaging Label</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Every single jar delivered to your home carries our authentic packaging label featuring Assamese indigenous motifs, the Golden Tree logo, certified 100% vegetarian purity, and FSSAI Lic. No: <strong>20326101000625</strong>.
            </p>
          </div>

          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <img
              src="/images/ne_roots_label.jpg"
              alt="NE Roots Official Packaging Label with FSSAI 20326101000625"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </section>
      </main>

      {/* 8. Slide-Over Cart Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-drag-handle"></div>
            <div className="cart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/images/ner_logo_icon.jpg" alt="NE Roots Icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div>
                  <h3 style={{ fontSize: 18, margin: 0 }}>Your Pickle Basket</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cartCount} item(s) selected</span>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', fontSize: 24, color: 'var(--text-muted)', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close basket"
              >
                ✕
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div style={{ padding: '12px 24px', background: '#fff9e6', borderBottom: '1px solid #ffd147', fontSize: 12 }}>
              {cartSubtotal >= 599 ? (
                <span style={{ color: '#008738', fontWeight: 700 }}>🎉 You have qualified for FREE Express Delivery!</span>
              ) : (
                <span>Add <strong>₹{599 - cartSubtotal}</strong> more for <strong>FREE Delivery</strong> across India!</span>
              )}
              <div style={{ width: '100%', height: 6, background: '#ebdcd0', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (cartSubtotal / 599) * 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
                  <h4>Your basket is empty</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Add some delicious North Eastern pickles to get started!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="cart-item">
                    <img src={item.image || '/images/mango_pickle.jpg'} alt={item.name} className="cart-item-img" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                        Size: <strong>{item.weight}</strong> | ₹{item.price} each
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 8, background: '#fdfaf6' }}>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            style={{ padding: '6px 12px', background: 'none', fontWeight: 800, fontSize: 16, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span style={{ padding: '0 8px', fontSize: 14, fontWeight: 700 }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            style={{ padding: '6px 12px', background: 'none', fontWeight: 800, fontSize: 16, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <strong style={{ color: 'var(--primary-dark)', fontSize: 15 }}>
                          ₹{item.price * item.quantity}
                        </strong>

                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          style={{ background: 'none', color: '#b91c1c', fontSize: 14, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Checkout */}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Items Total (GST Included):</span>
                  <strong>₹{cartSubtotal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery Charge:</span>
                  <span>{cartSubtotal >= 599 ? <strong style={{ color: '#008738' }}>FREE</strong> : '₹49'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 18, fontWeight: 800 }}>
                  <span>Final Amount:</span>
                  <span style={{ color: 'var(--primary-dark)' }}>₹{cartSubtotal >= 599 ? cartSubtotal : cartSubtotal + 49}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="checkout-btn"
                >
                  Proceed to Secure Checkout →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Statutory Legal & Consumer Protection Footer */}
      <footer className="store-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <img src="/images/ne_roots_logo.jpg" alt="NE Roots Brand Logo" style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #ffd147' }} />
                <h4 style={{ margin: 0 }}>NE Roots (North East Roots)</h4>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#f7dede', marginBottom: 14 }}>
                A vibrant FMCG brand rooted in the heart of Assam, dedicated to bringing the authentic, rich, and diverse flavours of North Eastern Indian pickles to your dining table.
              </p>
              <div style={{ fontSize: 12, color: '#ffd147', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="veg-icon"><span className="veg-icon-dot"></span></span>
                  <span><strong>FSSAI Lic. No:</strong> 20326101000625</span>
                </div>
                <div>📍 <strong>Registered Office &amp; Kitchen:</strong> NE Roots Foods Pvt. Ltd., Guwahati, Assam - 781001, India</div>
              </div>
            </div>

            <div className="footer-col">
              <h4>About &amp; Community</h4>
              <ul className="footer-links">
                <li><Link href="/team">About Our Team &amp; Assam Roots</Link></li>
                <li><Link href="/reviews">Customer Reviews &amp; Ratings</Link></li>
                <li><a href="#fiery">Assam Bhut Jolokia &amp; Khorisa</a></li>
                <li><a href="#kazi-nemu">Assam Kazi Nemu King Lime</a></li>
                <li><a href="#dalle">Sikkim Dalle Khursani</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Consumer Rights</h4>
              <ul className="footer-links">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy (DPDP 2026)</Link></li>
                <li><Link href="/refund-policy">48-Hr Return &amp; Refund</Link></li>
                <li><Link href="/grievance">Resident Grievance Officer</Link></li>
                <li><Link href="/admin">Store Admin Gateway</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Grievance &amp; Contact</h4>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#f7dede' }}>
                <p><strong>Resident Grievance Officer:</strong><br />Mr. Soumarjyoti Bhuyan</p>
                <p style={{ marginTop: 6 }}>📧 <strong>Email:</strong> grievance@neroots.in</p>
                <p>📞 <strong>Helpline:</strong> +91 98765 43210</p>
                <p style={{ marginTop: 6, fontSize: 12, color: '#ffd147' }}>
                  ⏳ 48-Hour Statutory Acknowledgment • 30-Day Resolution SLA
                </p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div>
              © 2026 <strong>NE Roots (North East Roots)</strong>. All Rights Reserved. Handcrafted with pride in Assam, India 🇮🇳.
            </div>
            <div>
              100% Compliant with Consumer Protection (E-Commerce) Rules &amp; DPDP Act.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
