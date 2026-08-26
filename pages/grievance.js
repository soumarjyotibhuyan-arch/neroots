import Head from 'next/head';
import Link from 'next/link';

export default function Grievance() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Resident Grievance Officer &amp; Redressal | NE Roots</title>
        <meta name="description" content="Statutory Resident Grievance Redressal Officer coordinates for NE Roots under Rule 4(4) of the Consumer Protection (E-Commerce) Rules. 48h acknowledgment, 30-day resolution SLA." />
        <link rel="canonical" href="https://neroots.in/grievance" />
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
            Statutory Compliance • Rule 4(4) of E-Commerce Rules
          </div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Resident Grievance Redressal Mechanism</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            In accordance with Rule 4(4) and Rule 5(3) of the Consumer Protection (E-Commerce) Rules, 2020 (as amended 2026), the details of the designated Resident Grievance Officer are published below.
          </p>

          <div style={{
            background: 'var(--bg-cream)',
            border: '2px solid #ffd147',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            marginBottom: 32
          }}>
            <h3 style={{ fontSize: 20, color: 'var(--primary-dark)', marginBottom: 16 }}>
              🏛️ Designated Statutory Grievance Officer
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Officer Name</span>
                <strong>Mr. Soumarjyoti Bhuyan</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Designation</span>
                <strong>Head of Consumer Affairs &amp; Grievance Redressal</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Official Grievance Email</span>
                <a href="mailto:grievance@neroots.in" style={{ color: 'var(--primary)', fontWeight: 700 }}>grievance@neroots.in</a>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Consumer Helpline</span>
                <strong>+91 70026 69032</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Office Address</span>
                <span>NE Roots Foods Private Limited, G.S. Road, Guwahati, Assam - 781001, India</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>Working Hours</span>
                <span>Monday – Saturday (9:00 AM – 6:00 PM IST)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 12, textTransform: 'uppercase' }}>FSSAI Registration</span>
                <strong>Lic. No: 20326101000625</strong>
              </div>
            </div>
          </div>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7, color: 'var(--text-dark)' }}>
            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Statutory Timeframes &amp; Escalation SLA</h2>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>48-Hour Acknowledgment:</strong> Every grievance ticket received is assigned a unique tracking number and acknowledged within 48 hours.</li>
                <li><strong>30-Day Resolution SLA:</strong> The Grievance Officer is statutorily mandated to resolve and communicate the decision within thirty (30) days of receipt.</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>National Consumer Helpline (NCH) Portal</h2>
              <p>
                Consumers may also register their grievances on the Government of India National Consumer Helpline portal at <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>consumerhelpline.gov.in</a> or dial toll-free <strong>1915</strong>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
