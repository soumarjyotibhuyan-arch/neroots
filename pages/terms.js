import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Terms of Service &amp; Entity Disclosures | NE Roots</title>
        <meta name="description" content="Official Terms of Service, Legal Metrology, and Business Entity Disclosures for NE Roots (North East Roots), Guwahati, Assam. FSSAI Lic. No: 20326101000625." />
        <link rel="canonical" href="https://neroots.in/terms" />
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
            Statutory Legal Document • 2026 E-Commerce Edition
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Terms of Service &amp; Business Disclosures</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Effective Date: January 1, 2026 | In compliance with the Consumer Protection (E-Commerce) Rules, 2020 (as amended 2026) and the Consumer Protection Act, 2019.
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>1. Business Entity Disclosures (Rule 4(1))</h2>
              <p>
                <strong>NE Roots (North East Roots)</strong> operates as an artisanal FMCG food enterprise committed to authentic regional cuisine.
              </p>
              <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                <li><strong>Entity Name:</strong> NE Roots Foods Private Limited</li>
                <li><strong>Brand Name:</strong> NE Roots (North East Roots)</li>
                <li><strong>FSSAI Registration / License No:</strong> 20326101000625</li>
                <li><strong>Registered Kitchen Address:</strong> G.S. Road, Guwahati, Kamrup Metropolitan, Assam - 781001, India</li>
                <li><strong>Customer Support Email:</strong> soumarjyotibhuyan@gmail.com</li>
                <li><strong>Consumer Helpline:</strong> +91 70026 69032</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>2. Right to Transparent Pricing &amp; Net Quantity</h2>
              <p>
                All prices shown on this platform are in Indian Rupees (INR) and are explicitly inclusive of Goods and Services Tax (GST) and all statutory levies. Net weights (250g, 500g, 1kg) and ingredient listings comply strictly with the Legal Metrology (Packaged Commodities) Rules.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>3. Delivery Timelines &amp; Fulfillment</h2>
              <p>
                All orders are freshly packed at our kitchen in Assam and dispatched via air/surface express couriers within 24–48 hours of order confirmation. Standard pan-India delivery timeframe is <strong>3 to 5 business days</strong>. Tracking details are provided via email or SMS upon dispatch.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>4. Food Safety &amp; Quality Guarantee</h2>
              <p>
                Our pickles are prepared under strict hygienic conditions conforming to FSSAI standards using pure cold-pressed mustard oil, GI-tagged Assamese lemons (Nemu), King Chilli (Bhut Jolokia), and natural spices without artificial chemical preservatives or synthetic dyes.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>5. Dispute Resolution &amp; Jurisdiction</h2>
              <p>
                Any dispute arising out of or related to our products or services shall be subject to the exclusive jurisdiction of the competent courts in Guwahati, Assam, India.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
