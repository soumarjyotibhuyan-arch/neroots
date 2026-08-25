import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Privacy Policy (DPDP Act 2026) | NE Roots</title>
        <meta name="description" content="NE Roots (North East Roots) Privacy Policy in strict compliance with the Digital Personal Data Protection (DPDP) Act 2026 and IT Act 2000." />
        <link rel="canonical" href="https://neroots.in/privacy" />
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
            Data Protection &amp; Privacy Policy • DPDP Act 2026 Compliant
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Privacy &amp; Data Protection Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Governed by the Digital Personal Data Protection (DPDP) Act, 2023 / 2026 and Information Technology Act, 2000.
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>1. Data Fiduciary Commitment</h2>
              <p>
                <strong>NE Roots (North East Roots)</strong> acts as the Data Fiduciary. We collect only the minimal personal data (Name, Phone number, Delivery address, Email address) strictly necessary to process, package, and deliver your pickle orders.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>2. Purpose Limitation &amp; Zero Data Monetization</h2>
              <p>
                We do not sell, rent, trade, or monetize your personal data with third-party advertisers or data brokers under any circumstances. Information is shared exclusively with our logistics courier partners solely to execute doorstep delivery.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>3. Payment &amp; Transaction Security</h2>
              <p>
                We do not store your raw bank details, UPI MPINs, or debit/credit card CVVs. All online payment transactions are processed via RBI-authorized, end-to-end encrypted payment gateways.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>4. Consumer Rights (Data Access, Correction &amp; Erasure)</h2>
              <p>
                Under the DPDP Act, you have the right to request a copy of your stored order information, demand rectification of inaccuracies, or request permanent deletion of your customer record by emailing our Data Grievance Officer at <strong>privacy@neroots.in</strong>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
