# Unified Payment Gateway & Webhook Integration Guide
## NE Roots (North East Roots) Artisanal Pickles

This guide provides step-by-step instructions to configure **Razorpay / UPI Intent / Dynamic QR / Webhooks** for NE Roots on Vercel and local development.

---

### Step 1: Select & Register Your Merchant Account

1. **Merchant Portal**: Go to [Razorpay](https://razorpay.com/) (or PhonePe PG / PayU).
2. **Account Sign Up**: Sign up using your business email (`contact@neroots.in` or `utpalabhuyan29@gmail.com`).
3. **Business Profile & KYC**:
   - **Business Type**: Proprietorship / Private Limited
   - **Category**: Food & FMCG / E-Commerce (Pickles & Preserves)
   - **FSSAI License**: `20326101000625`
   - **Store Website**: `https://neroots-murex.vercel.app` (or `https://neroots.vercel.app`)
   - **Bank Account**: Enter business bank account for daily T+1 automated payouts.

---

### Step 2: Obtain Your API Credentials (Sandbox & Live)

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. In the left navigation, switch to **Test Mode** (top-right toggle) or **Live Mode**.
3. Navigate to **Account & Settings** > **API Keys**.
4. Click **Generate Key ID and Secret**.
5. Save your keys securely:
   - **Key ID**: Starts with `rzp_test_...` (in test) or `rzp_live_...` (in production).
   - **Key Secret**: 32-character secret string.

---

### Step 3: Configure Environment Variables

#### A. Local Development (`.env.local`)
Create or edit `.env.local` in your root directory:
```env
# Payment Gateway Credentials (Never expose Secret on frontend)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here

# Webhook Secret for Asynchronous Verification
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

#### B. Vercel Production Environment
1. Open your [Vercel Dashboard](https://vercel.com) > `pickle-store` project.
2. Go to **Settings** > **Environment Variables**.
3. Add the following keys:
   - `RAZORPAY_KEY_ID` (Production / Preview)
   - `RAZORPAY_KEY_SECRET` (Production / Preview)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Production / Preview)
   - `RAZORPAY_WEBHOOK_SECRET` (Production / Preview)
4. Trigger a redeployment for live keys to activate.

---

### Step 4: Backend Order Creation & Price Integrity Flow

All payments originate from our secure server endpoint to prevent client-side price tampering:
- **Endpoint**: [`POST /api/payment/create-order`](file:///Users/soumarjyotibhuyan/Desktop/pickle-store/pages/api/payment/create-order.js)
- **Security Check**: Recalculates cart total directly from `db.products` catalog prices in INR paise (`₹249 = 24900 paise`).
- **Response**: Returns `{ orderId, amount, currency: "INR", keyId, isSandbox }`.

---

### Step 5: Adaptive Checkout Frontend (Mobile vs Desktop)

Our checkout interface automatically detects the customer's device:

| Device Type | User Interface Flow | Capabilities |
| :--- | :--- | :--- |
| **📱 Mobile (Intent Flow)** | Direct UPI Intent | Automatically triggers installed apps (**Google Pay, PhonePe, Paytm, CRED, BHIM**) for 1-tap authorization without typing UPI ID. |
| **💻 Desktop / Tablet (Dynamic QR)** | Dynamic UPI QR Modal | Renders a unique single-use QR code tied to the `order_id` with an **active 5-minute countdown timer** to keep pending inventory accurate, plus Credit/Debit Cards & NetBanking. |

---

### Step 6: Register Webhooks for Asynchronous Payment Verification

Webhooks ensure that if a customer closes their browser tab or loses connectivity immediately after completing UPI authorization, your store still receives the confirmation.

1. In Razorpay Dashboard, navigate to **Account & Settings** > **Webhooks**.
2. Click **+ Add New Webhook**.
3. **Webhook URL**:
   ```
   https://neroots-murex.vercel.app/api/payment/webhook
   ```
4. **Secret**: Enter your secret (e.g. `ne_roots_webhook_secret_2026`). Set this same value in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**: Check the following events:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
6. Click **Create Webhook**.

---

### Step 7: End-to-End Testing & Sandbox Verification

#### Sandbox / Test Payment Matrix
| Payment Method | Test Input Details | Expected Result |
| :--- | :--- | :--- |
| **UPI** | `success@razorpay` (or scan test QR) | Instant Success (HTTP 200) |
| **Cards** | `4111 1111 1111 1111`, Any Future Date, CVV `123`, OTP `123456` | Instant Success (HTTP 200) |
| **Failed Simulation** | `failure@razorpay` | Payment Declined Toast (Cart retained) |
| **COD Fallback** | Select "Cash on Delivery" radio | Placed directly as `Pending (Cash on Delivery)` |

---

### Production Checklist Before Going Live
- [x] Server-side price integrity verified on all order creations.
- [x] HMAC-SHA256 digital signature verification active on `/api/payment/verify`.
- [x] Webhook signature verification active on `/api/payment/webhook`.
- [x] 5-minute dynamic countdown timer prevents abandoned stock reservation.
- [x] Swap `rzp_test_...` credentials to `rzp_live_...` in Vercel settings when ready for real bank settlements.
