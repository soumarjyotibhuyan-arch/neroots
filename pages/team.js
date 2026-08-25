import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from './_app';

export default function Team() {
  const { cart, cartCount, cartSubtotal, isCartOpen, setIsCartOpen, removeFromCart } = useStore();

  const [team, setTeam] = useState([]);
  const [companyStory, setCompanyStory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
        setCompanyStory(data.companyStory || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>About Our Team &amp; Assam Heritage | NE Roots</title>
        <meta name="description" content="Meet the team behind NE Roots (North East Roots). Rooted in Assam, passionate about indigenous pickle preservation and fair-trade farmer partnerships." />
        <link rel="canonical" href="https://neroots.in/team" />
        <meta property="og:title" content="About Our Team &amp; Assam Heritage | NE Roots" />
        <meta property="og:description" content="Discover the artisans and food technologists preserving authentic North Eastern flavours in Assam." />
        <meta property="og:image" content="/images/hero_banner.jpg" />
      </Head>

      {/* Indigenous Assamese Pattern Strip */}
      <div className="ne-zigzag-strip"></div>

      {/* Statutory Top Banner */}
      <div className="top-banner">
        <div className="container">
          <div className="top-banner-content">
            <span>🌿 100% Pure Vegetarian</span>
            <span className="top-banner-fssai">FSSAI Lic. No: <strong>20326101000625</strong></span>
            <span>🚚 Free Express Shipping Above ₹599</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
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
            <Link href="/team" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              Our Team 👥
            </Link>
            <Link href="/reviews" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
              Reviews
            </Link>
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

      {/* Hero Story Banner */}
      <main className="container" style={{ flex: 1, padding: '40px 20px' }}>
        <section
          className="team-story-grid"
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
              <span>🏺</span> Our Story &amp; Vision
            </div>
            <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: '0 0 16px 0', color: 'var(--text-dark)' }}>
              {companyStory.headline || 'Rooted in Assam, Dedicated to North Eastern Heritage'}
            </h1>
            <p style={{ color: 'var(--text-dark)', fontSize: 15, lineHeight: 1.7, margin: '0 0 16px 0' }}>
              {companyStory.narrative || 'NE Roots was founded to bring the authentic, rich, and diverse flavours of North Eastern Indian pickles to food lovers worldwide. Specializing exclusively in North Eastern flavours, our pickles are crafted using traditional recipes and locally sourced ingredients.'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '14px' }}>
              &quot;{companyStory.mission || 'Our mission is to celebrate regional culinary heritage while ensuring freshness, authenticity, and supporting local communities and agriculture in Assam.'}&quot;
            </p>
          </div>

          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
            <img
              src="/images/hero_banner.jpg"
              alt="NE Roots Assam Kitchen & Tea Gardens"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </section>

        {/* Core Pillars / Commitments */}
        <section style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '32px 24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '36px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 24px auto' }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1 }}>
              Our 4 Pillars
            </span>
            <h2 style={{ fontSize: 24, margin: '6px 0 0 0' }}>The NE Roots Promise</h2>
          </div>

          <div className="team-pillars-grid">
            {(companyStory.commitments || [
              "100% Sourced within North East India",
              "No Chemical Preservatives or Synthetic Colours",
              "Fair-Trade Direct Farm Partnerships",
              "FSSAI Certified Hygienic Processing (Lic: 20326101000625)"
            ]).map((comm, idx) => (
              <div key={idx} style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  {idx === 0 ? '🌿' : idx === 1 ? '✨' : idx === 2 ? '🤝' : '📜'}
                </div>
                <h4 style={{ fontSize: 15, margin: '0 0 6px 0', color: 'var(--text-dark)' }}>
                  {comm}
                </h4>
              </div>
            ))}
          </div>
        </section>

        {/* Team Members Grid */}
        <section style={{ marginBottom: '50px' }}>
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px auto' }}>
            <span style={{ background: '#fff5f5', color: 'var(--primary)', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              The Custodians of Taste
            </span>
            <h2 style={{ fontSize: 28, margin: '10px 0 8px 0' }}>Meet Our Leadership &amp; Culinary Team</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Passionate innovators, master picklers, and agricultural specialists working tirelessly from Assam to bring you gourmet perfection.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading team profiles...</p>
            </div>
          ) : (
            <div className="team-cards-grid">
              {team.map(member => (
                <div
                  key={member.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <img
                        src={member.image || '/images/ner_logo_icon.jpg'}
                        alt={member.name}
                        style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffd147' }}
                      />
                      <div>
                        <h3 style={{ fontSize: 18, margin: '0 0 4px 0', color: 'var(--text-dark)' }}>{member.name}</h3>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{member.role}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {member.location}</div>
                      </div>
                    </div>

                    <div style={{ background: '#fff9e6', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 12 }}>
                      Focus: {member.speciality}
                    </div>

                    <p style={{ fontSize: 13, color: '#4a4036', lineHeight: 1.6, margin: 0 }}>
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back to Catalog CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ fontSize: 26, margin: '0 0 10px 0', color: '#ffffff' }}>Taste the Passion in Every Jar</h2>
          <p style={{ fontSize: 15, maxWidth: 600, margin: '0 auto 24px auto', opacity: 0.95 }}>
            Discover our curated range of authentic Assam Bhut Jolokia, GI-tagged Kazi Nemu, and Himalayan Dalle Khursani pickles.
          </p>
          <Link
            href="/"
            style={{
              background: '#ffd147',
              color: 'var(--text-dark)',
              padding: '14px 32px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: 15,
              display: 'inline-block'
            }}
          >
            Explore Pickle Varieties →
          </Link>
        </div>
      </main>

      {/* Slide-Over Cart Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
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
                style={{ background: 'none', fontSize: 24, color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
                  <h4>Your basket is empty</h4>
                  <Link href="/" onClick={() => setIsCartOpen(false)} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                    Explore Pickles →
                  </Link>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartItemId} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pack: {item.weight} • Qty: {item.quantity}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <strong style={{ color: 'var(--primary-dark)' }}>₹{item.price * item.quantity}</strong>
                        <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', color: '#b91c1c', fontSize: 13 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span>Items Total:</span>
                  <strong>₹{cartSubtotal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 18, fontWeight: 800 }}>
                  <span>Final Amount:</span>
                  <span style={{ color: 'var(--primary-dark)' }}>₹{cartSubtotal >= 599 ? cartSubtotal : cartSubtotal + 49}</span>
                </div>
                <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="checkout-btn">
                  Proceed to Secure Checkout →
                </Link>
              </div>
            )}
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
