# Google Cloud Console & Google Identity Services (GIS) Setup Guide
## NE Roots (North East Roots) E-Commerce & Admin Portal

This guide provides step-by-step instructions to configure **Google Cloud OAuth 2.0 Client Credentials** and connect Google Sign-In & Google One Tap to your NE Roots store on Vercel and local development.

---

### Step 1: Create or Select Your Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the **Project Dropdown** and select **New Project**.
3. Name your project: `NE Roots Pickle Store` (or `ne-roots-ecommerce`).
4. Click **Create** and ensure your new project is active.

---

### Step 2: Configure the OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. **User Type**: Select **External** and click **Create**.
3. **App Information**:
   - **App name**: `NE Roots`
   - **User support email**: Select `utpalabhuyan29@gmail.com` or `soumarjyotibhuyan@gmail.com`
   - **App logo**: (Optional) Upload your NE Roots logo
4. **App Domain**:
   - **Application home page**: `https://pickle-store-murex.vercel.app`
   - **Application privacy policy link**: `https://pickle-store-murex.vercel.app/privacy`
   - **Application terms of service link**: `https://pickle-store-murex.vercel.app/terms`
   - **Authorized domains**: Add `vercel.app` and your custom domain `neroots.in` (if configured)
5. **Developer Contact Information**:
   - Enter `utpalabhuyan29@gmail.com` or `soumarjyotibhuyan@gmail.com`.
6. Click **Save and Continue**.

---

### Step 3: Create OAuth 2.0 Web Client Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** and choose **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Set **Name**: `NE Roots Web Storefront`.
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `https://neroots-murex.vercel.app`
   - `https://neroots.vercel.app`
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `https://neroots-murex.vercel.app`
   - `https://neroots-murex.vercel.app/admin`
   - `https://neroots-murex.vercel.app/checkout`
7. Click **Create**.
8. A modal will appear showing your **Client ID** (e.g. `123456789012-xxxx.apps.googleusercontent.com`) and **Client Secret**.

---

### Step 4: Configure Environment Variables

#### 1. In Local Development (`.env.local`)
Create or edit `.env.local` in your project root:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 2. In Vercel Production
1. Go to your [Vercel Dashboard](https://vercel.com).
2. Select the `pickle-store` project.
3. Go to **Settings** > **Environment Variables**.
4. Add:
   - Key: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Value: `your-google-client-id.apps.googleusercontent.com`
   - Environments: Production, Preview, Development
5. (Optional for backend token auditing) Add `GOOGLE_CLIENT_SECRET`.
6. Redeploy or trigger a build for the environment variables to take effect.

---

### Step 6: Authorized Admin Whitelist

The NE Roots access control whitelist is configured in `data.json` and `lib/db.js` for:
- 👑 **`utpalabhuyan29@gmail.com`** — **Owner / Super Admin** (Full unrestricted administrative privileges)
- ⚡ **`soumarjyotibhuyan@gmail.com`** — **Store Administrator** (Full store management privileges)

When either of these accounts signs in via Google Sign-In or One Tap, the backend validates their cryptographic Google ID token, issues an authenticated session, and grants access to the Live Admin Dashboard.

---

### Security Architecture & Implementation Summary

| Layer | Feature | Technology & Protocol |
| :--- | :--- | :--- |
| **Frontend** | Google One Tap & GIS SDK | `https://accounts.google.com/gsi/client` with auto-session discovery |
| **Navbar & Cart** | User Profile Menu & Fast Sign-In | `UserMenu.js`, `GoogleSignInBtn.js`, `CartDrawer.js` |
| **Checkout** | 1-Click Fast Checkout Auto-fill | Auto-populates customer name, email, and links order history |
| **Reviews** | Google Verified Reviewer | Verifies identity and attaches reviewer badge & avatar |
| **Backend** | Cryptographic Token Verification | Official `google-auth-library` (`OAuth2Client.verifyIdToken`) |
| **Session** | HttpOnly Cookie & Token Auth | `pickle_session` cookie + JWT Bearer fallback |
| **RBAC** | Strict Email Whitelist | Checked against authorized Super Admin / Store Admin records |
