import Head from 'next/head';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>48-Hour Return &amp; Refund Policy | NE Roots</title>
        <meta name="description" content="NE Roots (North East Roots) 48-Hour 100% Free Replacement or Full Refund guarantee for transit damages and quality assurance under Indian E-Commerce rules." />
        <link rel="canonical" href="https://neroots.in/refund-policy" />
      </Head>

      <div className="ne-zigzag-strip"></div>

      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-logo">
            <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
            <div>
              <div className="brand-name">NE Roots</div>
              <div className="brand-tagline">North East Roots • Flavours of Assam</div>
            </div>
          </Link>
          <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-navy)' }}>
            ← Back to Storefront
          </Link>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '40px 20px', maxWidth: 840 }}>
        <div style={{ background: '#fff', padding: '40px 36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'inline-block', background: '#fff5f5', color: 'var(--primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            Consumer Protection • 100% Quality Guarantee
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Return, Replacement &amp; Refund Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Clear, transparent policies for return and refunds in accordance with the Consumer Protection (E-Commerce) Rules.
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            <div style={{ background: '#fff9e6', padding: 20, borderRadius: 12, border: '1px solid #ffd147' }}>
              <h3 style={{ fontSize: 18, color: '#8c1010', marginBottom: 6 }}>🛡️ 48-Hour Transit Damage &amp; Defect Guarantee</h3>
              <p style={{ margin: 0, fontSize: 14 }}>
                If your pickle jar arrives broken, leaking, with a broken safety seal, or spoiled, notify us within <strong>48 hours</strong> of delivery. We will immediately dispatch a <strong>100% Free Replacement</strong> or process a <strong>Full Refund</strong> with no return shipping fees charged to you.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>1. Food Safety &amp; Non-Returnable Nature</h2>
              <p>
                Because our pickles are perishable consumable food products governed by FSSAI hygiene guidelines, opened jars cannot be returned for general change of mind. However, defective, damaged, or incorrectly dispatched products are fully covered.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>2. How to Claim a Replacement or Refund</h2>
              <ol style={{ paddingLeft: 20, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Take a clear photo/video of the damaged jar or packaging box.</li>
                <li>WhatsApp us at <strong>+91 98765 43210</strong> or email <strong>orders@neroots.in</strong> with your Order ID (e.g. #NER-2041).</li>
                <li>Our team will acknowledge your claim within <strong>24 hours</strong> and initiate resolution.</li>
              </ol>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>3. Refund Timelines</h2>
              <p>
                Approved refunds are processed automatically back to your original payment method (Bank account / UPI / Card) within <strong>3 to 5 business days</strong>. For Cash on Delivery orders, refunds are transferred via instant UPI or NEFT.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
