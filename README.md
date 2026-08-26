# 🌶️ NE Roots (North East Roots) — Artisanal E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Payment](https://img.shields.io/badge/Razorpay-UPI%20%26%20Cards-008738?logo=razorpay)](https://razorpay.com/)
[![Deployment](https://img.shields.io/badge/Vercel-Production-000000?logo=vercel)](https://neroots.vercel.app)
[![FSSAI](https://img.shields.io/badge/FSSAI%20Licensed-20326101000625-green)](https://neroots.vercel.app/grievance)

> **NE Roots (North East Roots)** is a full-stack, production-ready artisanal e-commerce web application handcrafted for celebrating authentic culinary biodiversity from Assam and North East India.

---

## 🌐 Live Storefront & Demo

* **Production URL:** [https://neroots.vercel.app](https://neroots.vercel.app)
* **GitHub Repository:** [soumarjyotibhuyan-arch/pickle-storeV2](https://github.com/soumarjyotibhuyan-arch/neroots)

---

## ✨ Key Features & Capabilities

### 🛒 Storefront & Shopping Experience
* **Artisanal Product Catalog**: Features GI-tagged Assam Nemu Lemons, world-famous Bhut Jolokia (Ghost Peppers), Fermented Bamboo Shoots (Khorisa), Himalayan Dalle Khursani, Wild Hill Garlic, and Raw Mango Fusion pickles.
* **Dynamic Weight Selectors**: Multi-tier quantity pricing (`250g`, `500g`, `1kg`) with instant total calculation and cart batching.
* **Mobile-Optimized UX**: Responsive glassmorphism interface with non-clipping aspect-ratio image containers and tap-friendly controls.
* **PWA & Mobile Navigation**: Progressive Web App manifest and fixed quick action toolbar for mobile users.

### 💳 Payment & Checkout Integration
* **Razorpay Standard Checkout**: Native pop-up checkout support for UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallet payments.
* **Direct UPI Transfer Option**: Manual UPI ID transfer fallback for customer convenience.
* **Cash on Delivery (COD)**: Automated shipping tier calculation (Free shipping above ₹599).

### ⭐ Dynamic Real-Time Rating & Review Engine
* **0.0 Default Metric**: Products without customer reviews start clean at `0.0 (0 reviews)` instead of hardcoded numbers.
* **Real-Time Dynamic Recalculation**: Backend automatically re-calculates product average rating (`★ 0.0` - `5.0`) and review count whenever new reviews are submitted or moderated.
* **Verified Customer Badge**: Verified purchase indicator for customer reviews with star-distribution breakdown.

### 🔐 Admin Dashboard & Store Operations
* **Google Auth & Whitelist Security**: Restricted access via Google OAuth identity verification and admin whitelist.
* **Order Management Hub**: Real-time status update controls (`Pending`, `Payment Pending`, `Confirmed`, `Shipped`, `Delivered`).
* **Inventory & Recipe Manager**: Live product price, stock toggle, and team bio editor.
* **Indestructible Store Persistence**: Hybrid local storage & serverless cloud snapshot synchronization engine with 1-click JSON backup export/import.

### 📜 Statutory Compliance & Legal Pages
* **FSSAI License Display**: Official registration `20326101000625`.
* **DPDP Act (2026) Privacy Policy**: Customer data access, correction, and erasure workflows.
* **E-Commerce Rule 4(4) Grievance Redressal**: Resident Grievance Officer details with statutory SLA tracking (48-hour acknowledgment, 30-day resolution).
* **48-Hour Replacement & Refund Policy**: Detailed claim steps for damaged orders.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.1 (Pages Router) |
| **Frontend** | React 18, Custom Responsive CSS Engine |
| **Backend & APIs** | Next.js Serverless API Routes |
| **Database & Persistence** | Serverless File Storage + In-Memory Cache + Dual-Layer Local Storage Engine |
| **Payments** | Razorpay Node SDK & Client Integration |
| **Authentication** | Google Identity Services (GSI) OAuth |
| **Deployment** | Vercel Serverless Platform |

---

## 📂 Repository Project Structure

```
pickle-store/
├── components/          # Reusable UI Components (Navbar, MobileNav, UserMenu, etc.)
├── data.json            # Main Store Data Store (Products, Orders, Reviews, Team)
├── lib/                 # Core Helper Utilities (db.js, security.js, razorpay.js)
├── pages/               # Next.js Pages & API Endpoints
│   ├── api/             # Serverless API Routes (orders, reviews, payment, auth, sync-store)
│   ├── _app.js          # App Wrapper & Global Layout
│   ├── admin.js         # Store Admin Management Dashboard
│   ├── checkout.js      # Customer Cart & Payment Gateway Checkout
│   ├── grievance.js     # Statutory Grievance Redressal Officer Details
│   ├── index.js         # Main Storefront & Product Showcase
│   ├── privacy.js       # DPDP Act Privacy Policy
│   ├── refund-policy.js # 48-Hour Return & Refund Policy
│   ├── reviews.js       # Verified Customer Reviews Page
│   ├── team.js          # Founder, Heritage & Assam Roots Story
│   └── terms.js         # Terms of Service & FSSAI Details
├── public/              # Static Assets, Product Jar Images & Web Manifest
└── styles/              # Global Design Tokens & Responsive CSS
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/soumarjyotibhuyan-arch/pickle-storeV2.git
cd pickle-storeV2
npm install
```

### 3. Environment Variables Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_EMAILS=admin@yourdomain.com,owner@yourdomain.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@yourdomain.com,owner@yourdomain.com
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📞 Support & Contact

* **Founder & Managing Director:** Mr. Soumarjyoti Bhuyan
* **Grievance & Support Email:** [soumarjyotibhuyan@gmail.com](mailto:soumarjyotibhuyan@gmail.com)
* **Customer Helpline:** +91 70026 69032
* **Registered Address:** G.S. Road, Guwahati, Kamrup Metropolitan, Assam - 781001, India

---

© 2026 **NE Roots Foods Private Limited**. All Rights Reserved. Handcrafted with ❤️ in Assam.
