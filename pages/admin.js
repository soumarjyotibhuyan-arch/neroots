import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useStore } from './_app';

export default function Admin() {
  const { showToast } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Email input for quick Google sign in simulation / testing
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const googleBtnRef = useRef(null);

  // Tabs: 'orders', 'inventory', 'add', 'team_story', 'reviews', 'admins'
  const [activeTab, setActiveTab] = useState('orders');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminTeam, setAdminTeam] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [companyStory, setCompanyStory] = useState({});
  const [customerReviews, setCustomerReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add Product Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [category, setCategory] = useState('Spicy');
  const [price, setPrice] = useState('');
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [origin, setOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/images/mango_pickle.jpg');
  const [ingredients, setIngredients] = useState('');
  const [badge, setBadge] = useState('');

  // Add Team Member Form State
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberBio, setMemberBio] = useState('');
  const [memberImage, setMemberImage] = useState('/images/ner_logo_icon.jpg');
  const [memberLocation, setMemberLocation] = useState('Guwahati, Assam');
  const [memberSpeciality, setMemberSpeciality] = useState('Assam Heritage & Fermentation');

  // Edit Company Story Form State
  const [storyHeadline, setStoryHeadline] = useState('');
  const [storyNarrative, setStoryNarrative] = useState('');
  const [storyMission, setStoryMission] = useState('');

  // Add New Admin Form State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Store Manager');

  // Edit Modals State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingTeamMember, setEditingTeamMember] = useState(null);

  const getAuthToken = () => {
    try {
      return sessionStorage.getItem('pickle_admin_token') || '';
    } catch (e) {
      return '';
    }
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  });

  // Check saved authentication session on mount
  useEffect(() => {
    async function initAdminAuth() {
      try {
        const savedToken = sessionStorage.getItem('pickle_admin_token');
        const savedUser = sessionStorage.getItem('pickle_admin_user');
        if (savedToken && savedUser) {
          setIsAuthenticated(true);
          setCurrentUser(JSON.parse(savedUser));
          loadData(savedToken);
          setIsCheckingAuth(false);
          return;
        }

        // If no token in sessionStorage, check active Google session cookie
        const res = await fetch('/api/auth/google');
        if (res.ok) {
          const authData = await res.json();
          if (authData.isAuthenticated && authData.isAdmin && authData.user?.email) {
            await performGoogleAuth({ email: authData.user.email, name: authData.user.name });
            setIsCheckingAuth(false);
            return;
          }
        }
      } catch (e) {
        console.error('Admin auth check error:', e);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    initAdminAuth();
  }, []);

  // Initialize Google Identity Services if a valid Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const isRealClientId = clientId && !clientId.includes('example') && !clientId.startsWith('1234567890');

    if (isRealClientId && !isAuthenticated && typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 320
          });
        }
      } catch (err) {
        console.error('Google One Tap initialization note:', err);
      }
    }
  }, [isAuthenticated]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) return;
    performGoogleAuth({ credential: response.credential });
  };

  const performGoogleAuth = async (payload) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google_login', ...payload })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('pickle_admin_token', data.token);
        sessionStorage.setItem('pickle_admin_user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        showToast(`✅ Welcome back, ${data.user.name}! (Verified Google Admin)`);
        loadData(data.token);
      } else {
        setAuthError(data.error || 'Google account is not authorized as an Admin.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Failed to connect to authentication service.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualGoogleLogin = (e) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) {
      setAuthError('Please enter your Google account email');
      return;
    }
    performGoogleAuth({ email: googleEmailInput.trim() });
  };

  const notifyDataSync = (type, data) => {
    try {
      if (type === 'team' && data) localStorage.setItem('neroots_custom_team', JSON.stringify(data));
      if (type === 'story' && data) localStorage.setItem('neroots_company_story', JSON.stringify(data));
      if (type === 'products' && data) localStorage.setItem('neroots_custom_products', JSON.stringify(data));
      if (type === 'reviews' && data) localStorage.setItem('neroots_custom_reviews', JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('neroots_data_updated', { detail: { type } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('neroots_sync_channel');
        bc.postMessage({ type, timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}
  };

  const loadData = async (tokenOverride) => {
    const token = tokenOverride || getAuthToken();
    try {
      setLoading(true);
      const authHeaders = {
        'Authorization': `Bearer ${token}`
      };

      const now = Date.now();
      const [pRes, oRes, aRes, tRes, rRes] = await Promise.all([
        fetch(`/api/products?_t=${now}`, { cache: 'no-store' }),
        fetch(`/api/orders?_t=${now}`, { headers: authHeaders, cache: 'no-store' }),
        fetch(`/api/admin-auth?_t=${now}`, { headers: authHeaders, cache: 'no-store' }),
        fetch(`/api/team?_t=${now}`, { cache: 'no-store' }),
        fetch(`/api/reviews?_t=${now}`, { cache: 'no-store' })
      ]);

      if (oRes.status === 401 || aRes.status === 401) {
        handleLogout();
        showToast('🔒 Session expired. Please log in again.');
        return;
      }

      const pData = await pRes.json();
      const oData = await oRes.json();
      const aData = await aRes.json();
      const tData = await tRes.json();
      const rData = await rRes.json();

      const freshProducts = Array.isArray(pData) ? pData : [];
      const freshTeam = Array.isArray(tData.team) ? tData.team : [];
      const freshReviews = Array.isArray(rData) ? rData : [];

      setProducts(freshProducts);
      setOrders(Array.isArray(oData) ? oData : []);
      setAdminTeam(Array.isArray(aData.admins) ? aData.admins : []);
      setTeamMembers(freshTeam);
      if (tData.companyStory) {
        setCompanyStory(tData.companyStory);
        setStoryHeadline(tData.companyStory.headline || '');
        setStoryNarrative(tData.companyStory.narrative || '');
        setStoryMission(tData.companyStory.mission || '');
      }
      setCustomerReviews(freshReviews);

      // Sync to local storage
      notifyDataSync('team', freshTeam);
      if (tData.companyStory) notifyDataSync('story', tData.companyStory);
      notifyDataSync('products', freshProducts);
      notifyDataSync('reviews', freshReviews);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('pickle_admin_token');
      sessionStorage.removeItem('pickle_admin_user');
    } catch (e) {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('🔒 Signed out from Admin account.');
  };

  // Team & Story Handlers
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || !memberRole.trim()) {
      showToast('⚠️ Please enter team member name and role.');
      return;
    }

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: memberName.trim(),
          role: memberRole.trim(),
          bio: memberBio.trim(),
          image: memberImage.trim() || '/images/ner_logo_icon.jpg',
          location: memberLocation.trim() || 'Assam, India',
          speciality: memberSpeciality.trim() || 'North Eastern Heritage'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Added ${memberName} to the official Team page!`);
        setMemberName('');
        setMemberRole('');
        setMemberBio('');
        const updatedTeam = data.team || [];
        setTeamMembers(updatedTeam);
        notifyDataSync('team', updatedTeam);
      } else {
        showToast(`❌ ${data.error || 'Failed to add team member'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error adding team member.');
    }
  };

  const handleDeleteTeamMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the About Team page?`)) return;

    try {
      const res = await fetch(`/api/team?id=${memberId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🗑️ Team member removed.');
        const updatedTeam = data.team || [];
        setTeamMembers(updatedTeam);
        notifyDataSync('team', updatedTeam);
      } else {
        showToast(`❌ ${data.error || 'Failed to delete team member'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error deleting team member.');
    }
  };

  const handleUpdateStory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          updateStory: true,
          headline: storyHeadline.trim(),
          narrative: storyNarrative.trim(),
          mission: storyMission.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✅ Company story & mission updated live on /team!');
        const updatedStory = data.companyStory || {};
        setCompanyStory(updatedStory);
        notifyDataSync('story', updatedStory);
      } else {
        showToast(`❌ ${data.error || 'Failed to update company story'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error updating company story.');
    }
  };

  // Review Moderation Handler
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;

    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🗑️ Customer review deleted.');
        const updatedReviews = data.reviews || customerReviews.filter(r => String(r.id) !== String(reviewId));
        setCustomerReviews(updatedReviews);
        notifyDataSync('reviews', updatedReviews);
      } else {
        showToast(`❌ ${data.error || 'Failed to delete review.'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error deleting review.');
    }
  };

  const handleAddAdminUser = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      showToast('⚠️ Please enter the Google email address');
      return;
    }

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'add_admin',
          newAdminEmail: newAdminEmail.trim(),
          newAdminName: newAdminName.trim(),
          newAdminRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ ${newAdminEmail} added to authorized Google Admins!`);
        setNewAdminEmail('');
        setNewAdminName('');
        setAdminTeam(data.admins || []);
      } else {
        showToast(`❌ ${data.error || 'Failed to add admin user'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error adding admin user.');
    }
  };

  const handleRemoveAdmin = async (targetEmail) => {
    if (!confirm(`Are you sure you want to revoke admin access for ${targetEmail}?`)) return;

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'remove_admin', targetEmail })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('🗑️ Admin access revoked.');
        setAdminTeam(data.admins || []);
      } else {
        showToast(`❌ ${data.error || 'Failed to revoke admin'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error revoking admin.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      showToast('⚠️ Please provide name and base price.');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          shortName: shortName || name,
          category,
          price: Number(price),
          spiceLevel,
          origin,
          description,
          image,
          ingredients,
          badge
        })
      });

      if (res.ok) {
        showToast('✅ New pickle added to store pantry!');
        setName('');
        setShortName('');
        setPrice('');
        setDescription('');
        setIngredients('');
        setBadge('');
        setOrigin('');
        setActiveTab('inventory');
        loadData();
      } else {
        showToast('❌ Failed to add pickle.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error adding pickle.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: orderId, status: newStatus })
      });

      if (res.ok) {
        showToast(`✅ Order #${orderId} status updated to "${newStatus}"`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        showToast('❌ Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error updating status.');
    }
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      showToast('⚠️ Product Name and Base Price are required');
      return;
    }

    try {
      const basePrice = Number(editingProduct.price);
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: editingProduct.id,
          name: editingProduct.name,
          shortName: editingProduct.shortName || editingProduct.name,
          category: editingProduct.category,
          price: basePrice,
          prices: {
            "250g": basePrice,
            "500g": Math.round(basePrice * 1.8),
            "1kg": Math.round(basePrice * 3.3)
          },
          spiceLevel: editingProduct.spiceLevel,
          origin: editingProduct.origin,
          description: editingProduct.description,
          image: editingProduct.image,
          badge: editingProduct.badge,
          inStock: editingProduct.inStock !== false,
          ingredients: Array.isArray(editingProduct.ingredients)
            ? editingProduct.ingredients
            : (typeof editingProduct.ingredients === 'string' ? editingProduct.ingredients.split(',').map(s => s.trim()) : [])
        })
      });

      if (res.ok) {
        const updated = await res.json();
        showToast('✅ Pickle catalog details updated!');
        setProducts(prev => {
          const updatedList = prev.map(p => String(p.id) === String(updated.id) ? updated : p);
          notifyDataSync('products', updatedList);
          return updatedList;
        });
        setEditingProduct(null);
      } else {
        showToast('❌ Failed to update pickle.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Network error updating pickle.');
    }
  };

  const handleSaveEditTeamMember = async (e) => {
    e.preventDefault();
    if (!editingTeamMember || !editingTeamMember.name || !editingTeamMember.role) {
      showToast('⚠️ Team member Name and Role are required');
      return;
    }

    try {
      const res = await fetch('/api/team', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: editingTeamMember.id,
          name: editingTeamMember.name,
          role: editingTeamMember.role,
          bio: editingTeamMember.bio,
          location: editingTeamMember.location,
          speciality: editingTeamMember.speciality,
          image: editingTeamMember.image
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✅ Team member profile updated live on /team!');
        const updatedTeam = data.team || [];
        setTeamMembers(updatedTeam);
        notifyDataSync('team', updatedTeam);
        setEditingTeamMember(null);
      } else {
        showToast(`❌ ${data.error || 'Failed to update team member'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Network error updating team member.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this pickle from the catalog?')) return;

    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('🗑️ Pickle removed from catalog.');
        setProducts(prev => {
          const updatedList = prev.filter(p => p.id !== productId);
          notifyDataSync('products', updatedList);
          return updatedList;
        });
      } else {
        showToast('❌ Failed to delete.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error deleting product.');
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Verifying Google Admin Identity...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // GOOGLE ADMIN AUTHENTICATION / SIGN IN GATEWAY
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
        <Head>
          <title>Google Admin Portal | NE Roots</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="ne-zigzag-strip"></div>
        <header className="navbar">
          <div className="container nav-inner">
            <Link href="/" className="brand-logo">
              <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
              <div>
                <div className="brand-name">NE Roots</div>
                <div className="brand-tagline">North East Roots • Admin Portal</div>
              </div>
            </Link>
            <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
              ← Return to Store
            </Link>
          </div>
        </header>

        <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '40px 32px',
            maxWidth: 480,
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center'
          }}>
            {/* Google G Logo Badge */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
              <svg width="32" height="32" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 24, color: 'var(--primary-dark)', marginBottom: 8 }}>
              Google Admin Authentication
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Sign in with your verified Google Account to access the store management system.
            </p>

            {authError && (
              <div style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                textAlign: 'left',
                lineHeight: 1.4
              }}>
                <div>⚠️ {authError}</div>
              </div>
            )}

            {/* Official Google Identity Services Button */}
            <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, minHeight: 44 }}></div>

            <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'left', fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔒</span> Whitelisted Admin Security:
              </div>
              <p style={{ margin: '0 0 10px', color: 'var(--text-muted)' }}>
                Only verified Google accounts registered in the store whitelist (<strong>utpalabhuyan29@gmail.com</strong> or <strong>soumarjyotibhuyan@gmail.com</strong>) can access the store management portal.
              </p>
              <div style={{ color: '#64748b', fontSize: 11.5 }}>
                ℹ️ Google checks your credentials cryptographically on Google&apos;s servers before granting access.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  const safeOrders = Array.isArray(orders) ? orders : [];
  const totalRevenue = safeOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
  const totalOrdersCount = safeOrders.length;
  const pendingOrdersCount = safeOrders.filter(o => o?.status?.includes('Pending') || o?.status?.includes('Confirmed')).length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-cream)' }}>
      <Head>
        <title>Store Management Dashboard | NE Roots</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="ne-zigzag-strip"></div>
      {/* Top Navbar */}
      <header className="navbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-logo">
            <img src="/images/ne_roots_logo.jpg" alt="NE Roots Logo" className="brand-logo-img" />
            <div>
              <div className="brand-name">NE Roots</div>
              <div className="brand-tagline">Assam Kitchen &amp; Store Management</div>
            </div>
          </Link>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {/* Google Admin Profile Pill */}
            {currentUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#fff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)'
              }}>
                <img
                  src={currentUser.avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                  alt={currentUser.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ fontSize: 12, lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{currentUser.name}</div>
                  <div style={{ color: '#2d6a4f', fontSize: 10, fontWeight: 600 }}>✓ Google Verified ({currentUser.role})</div>
                </div>
              </div>
            )}

            <Link
              href="/"
              style={{
                background: 'var(--bg-cream)',
                color: 'var(--text-dark)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              🏪 View Store
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔒 Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: '36px 20px' }}>
        {/* Header & Metric Cards */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, color: 'var(--primary-dark)', marginBottom: 6 }}>
            Store Management Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Logged in as <strong>{currentUser?.email}</strong> with full admin authorization.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div style={{ background: '#fff', padding: 22, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Revenue</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-dark)', marginTop: 4 }}>₹{totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#2d6a4f', marginTop: 4 }}>Across all fulfilled orders</div>
          </div>

          <div style={{ background: '#fff', padding: 22, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Orders Received</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-spice)', marginTop: 4 }}>{totalOrdersCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{pendingOrdersCount} active / pending dispatch</div>
          </div>

          <div style={{ background: '#fff', padding: 22, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Average Order Value</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-gold)', marginTop: 4 }}>₹{avgOrderValue}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Per customer basket</div>
          </div>

          <div style={{ background: '#fff', padding: 22, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Catalog</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{products.length} Varieties</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Handcrafted recipes in stock</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="admin-tab-bar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          >
            📦 Customer Orders ({safeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            🥒 Pickle Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`admin-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          >
            ➕ Add New Pickle
          </button>
          <button
            onClick={() => setActiveTab('team_story')}
            className={`admin-tab-btn ${activeTab === 'team_story' ? 'active' : ''}`}
          >
            👥 About Team &amp; Story Editor ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          >
            ⭐ Reviews ({customerReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
          >
            🔐 Google Whitelist ({adminTeam.length})
          </button>
        </div>

        {/* TAB 1: CUSTOMER ORDERS */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ background: '#fff', padding: 40, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p>No customer orders placed yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      padding: 24,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>#{order.id}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>• {order.date}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                          {order.customerName} {order.phone && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>({order.phone})</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13,
                            border: '1px solid var(--border-color)',
                            background: order.status === 'Delivered' ? '#d8f3dc' : order.status === 'Shipped' ? '#e0f2fe' : '#fef3c7',
                            color: order.status === 'Delivered' ? '#1b4332' : order.status === 'Shipped' ? '#0369a1' : '#92400e',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pending (Cash on Delivery)">Pending (Cash on Delivery)</option>
                          <option value="Confirmed (Online Paid)">Confirmed (Online Paid)</option>
                          <option value="Preparing in Kitchen">Preparing in Kitchen 👩‍🍳</option>
                          <option value="Shipped">Shipped 🚚</option>
                          <option value="Delivered">Delivered ✅</option>
                          <option value="Cancelled">Cancelled ❌</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, fontSize: 14 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Ordered Items:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {order.cart?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-cream)', padding: '8px 12px', borderRadius: 6 }}>
                              <span>🥒 {item.name} ({item.weight}) × {item.quantity}</span>
                              <strong>₹{item.price * item.quantity}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Delivery Details:</div>
                        <p style={{ margin: 0, color: 'var(--text-dark)' }}>{order.address}</p>
                        {order.notes && <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: &quot;{order.notes}&quot;</p>}

                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 }}>
                          <span>Total ({order.paymentMethod}):</span>
                          <span style={{ color: 'var(--primary-dark)' }}>₹{order.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY & CATALOG */}
        {activeTab === 'inventory' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {products.map(p => (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: 160, position: 'relative' }}>
                  <img src={p.image || '/images/mango_pickle.jpg'} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.origin && (
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                      📍 {p.origin}
                    </span>
                  )}
                </div>

                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-spice)' }}>{p.category}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.spiceLevel}</span>
                  </div>

                  <h3 style={{ fontSize: 17, marginBottom: 8 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, flex: 1 }}>{p.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Base Price (250g)</span>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-dark)' }}>₹{p.price}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setEditingProduct({ ...p, ingredientsStr: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (p.ingredients || '') })}
                        style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ADD NEW PICKLE */}
        {activeTab === 'add' && (
          <div style={{ background: '#fff', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>➕ Add a New Handcrafted Pickle</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              Fill in the recipe and ingredient details to launch a new pickle jar in the store catalog.
            </p>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Pickle Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Rajasthani Ker Sangri Pickle"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  >
                    <option value="Spicy">Spicy 🌶️</option>
                    <option value="Regional">Regional Special 📍</option>
                    <option value="Garlic & Herbs">Garlic &amp; Herbs 🧄</option>
                    <option value="Sweet & Tangy">Sweet &amp; Tangy 🍋</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Spice Heat Level</label>
                  <select
                    value={spiceLevel}
                    onChange={e => setSpiceLevel(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  >
                    <option value="Mild">Mild 🌶️</option>
                    <option value="Medium">Medium 🌶️🌶️</option>
                    <option value="Hot">Hot 🌶️🌶️🌶️</option>
                    <option value="Fiery Hot">Fiery Hot 🔥</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Base Price for 250g (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 275"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Regional Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Jodhpur, Rajasthan"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Select Product Photo</label>
                <select
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                >
                  <option value="/images/mango_pickle.jpg">Artisanal Mango Pickle Jar</option>
                  <option value="/images/red_chilli_pickle.jpg">Banarasi Stuffed Red Chilli Jar</option>
                  <option value="/images/garlic_pickle.jpg">Whole Garlic Pickle Jar</option>
                  <option value="/images/sweet_lemon_pickle.jpg">Sweet &amp; Tangy Lemon Jar</option>
                  <option value="/images/bhut_jolokia_pickle.jpg">Fiery Ghost Pepper Jar</option>
                  <option value="/images/avakaya_pickle.jpg">Andhra Avakaya Martaban Jar</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Traditional recipe aged for 20 days with cold-pressed mustard oil..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 10
                }}
              >
                Save &amp; Publish Pickle to Store
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: ABOUT TEAM & STORY EDITOR */}
        {activeTab === 'team_story' && (
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Story & Mission Editor */}
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: 20, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📜</span> Edit Company Narrative &amp; Mission
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                Changes made here update the live text and commitments on the <Link href="/team" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>About Team page</Link>.
              </p>

              <form onSubmit={handleUpdateStory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Main Story Headline</label>
                  <input
                    type="text"
                    value={storyHeadline}
                    onChange={e => setStoryHeadline(e.target.value)}
                    placeholder="e.g. Rooted in Assam, Dedicated to North Eastern Heritage"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Brand Narrative</label>
                  <textarea
                    rows={3}
                    value={storyNarrative}
                    onChange={e => setStoryNarrative(e.target.value)}
                    placeholder="Brand history, family recipes, and Assamese culinary roots..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Mission Statement</label>
                  <textarea
                    rows={2}
                    value={storyMission}
                    onChange={e => setStoryMission(e.target.value)}
                    placeholder="Empowering local Assamese farmers and rural communities..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: 'var(--accent-navy)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 14,
                    fontWeight: 700,
                    alignSelf: 'flex-start'
                  }}
                >
                  💾 Save Story Changes Live
                </button>
              </form>
            </div>

            {/* Add Team Member Card */}
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: 20, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>➕</span> Add New Team Member
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                Add leadership, master picklers, or agricultural coordinators to the official <Link href="/team" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>About Team page</Link>.
              </p>

              <form onSubmit={handleAddTeamMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Priyanku Gogoi"
                      value={memberName}
                      onChange={e => setMemberName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Role / Designation *</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Pickler &amp; Fermentation Lead"
                      value={memberRole}
                      onChange={e => setMemberRole(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Tezpur, Assam"
                      value={memberLocation}
                      onChange={e => setMemberLocation(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Core Focus / Speciality</label>
                    <input
                      type="text"
                      placeholder="e.g. Sun-Curing &amp; Kazi Nemu Preservation"
                      value={memberSpeciality}
                      onChange={e => setMemberSpeciality(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Profile Image</label>
                  <select
                    value={memberImage}
                    onChange={e => setMemberImage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                  >
                    <option value="/images/ner_logo_icon.jpg">NE Roots Brand Emblem</option>
                    <option value="/images/ne_roots_logo.jpg">NE Roots Tree Logo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Biography &amp; Contribution</label>
                  <textarea
                    rows={3}
                    placeholder="Short bio highlighting background, passion for indigenous recipes, and commitment to quality..."
                    value={memberBio}
                    onChange={e => setMemberBio(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 14,
                    fontWeight: 700,
                    alignSelf: 'flex-start'
                  }}
                >
                  + Add Team Member to /team
                </button>
              </form>
            </div>

            {/* List Existing Team Members */}
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 18 }}>Current Team Members ({teamMembers.length})</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: 'var(--bg-cream)',
                      border: '1px solid var(--border-color)',
                      gap: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <img
                        src={member.image || '/images/ner_logo_icon.jpg'}
                        alt={member.name}
                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffd147' }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-dark)' }}>{member.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{member.role}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {member.location} • Focus: {member.speciality}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setEditingTeamMember({ ...member })}
                        style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id, member.name)}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER REVIEWS MODERATOR */}
        {activeTab === 'reviews' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⭐</span> Submitted Customer Reviews ({customerReviews.length})
                  </h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
                    Moderate, verify, or remove customer reviews published on the <Link href="/reviews" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Reviews page</Link>.
                  </p>
                </div>
              </div>

              {customerReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No customer reviews submitted yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {customerReviews.map(rev => (
                    <div
                      key={rev.id}
                      style={{
                        padding: 18,
                        borderRadius: 10,
                        background: 'var(--bg-cream)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ color: '#e62b2b', fontSize: 16 }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                          <strong style={{ fontSize: 14 }}>{rev.title}</strong>
                          {rev.verifiedPurchase && (
                            <span style={{ fontSize: 10, color: '#008738', background: '#d8f3dc', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                          &quot;{rev.comment}&quot;
                        </p>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <strong>{rev.author}</strong> ({rev.location}) • Flavour: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{rev.flavour}</span> • {rev.date}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        Delete Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE ADMIN TEAM WHITELIST */}
        {activeTab === 'admins' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* Add Admin Card */}
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔐</span> Authorize New Google Account
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                Grant store management access to any team member by whitelisting their Google Account email.
              </p>

              <form onSubmit={handleAddAdminUser} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr auto', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Google Email *</label>
                  <input
                    type="email"
                    placeholder="teammate@gmail.com"
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newAdminName}
                    onChange={e => setNewAdminName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Role</label>
                  <select
                    value={newAdminRole}
                    onChange={e => setNewAdminRole(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13 }}
                  >
                    <option value="Store Manager">Store Manager</option>
                    <option value="Kitchen Manager">Kitchen Manager</option>
                    <option value="Co-Owner">Co-Owner</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    height: 42
                  }}
                >
                  + Add Admin
                </button>
              </form>
            </div>

            {/* List of Authorized Admins */}
            <div style={{ background: '#fff', padding: 28, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 18 }}>Authorized Google Admin Accounts ({adminTeam.length})</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {adminTeam.map(admin => (
                  <div
                    key={admin.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 10,
                      background: 'var(--bg-cream)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={admin.avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                        alt={admin.name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{admin.name}</span>
                          <span style={{ fontSize: 11, background: '#d8f3dc', color: '#1b4332', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {admin.role}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{admin.email}</div>
                      </div>
                    </div>

                    {adminTeam.length > 1 && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.email)}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EDIT PRODUCT MODAL */}
        {editingProduct && (
          <div
            className="responsive-modal-overlay"
            onClick={() => setEditingProduct(null)}
          >
            <div
              className="responsive-modal-box"
              style={{ maxWidth: 640 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, margin: 0 }}>✏️ Edit Pickle Catalog Details</h2>
                <button onClick={() => setEditingProduct(null)} style={{ background: 'none', fontSize: 24, color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Pickle Full Name *</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Short Name</label>
                    <input
                      type="text"
                      value={editingProduct.shortName || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, shortName: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Category</label>
                    <select
                      value={editingProduct.category || 'Fiery North East'}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                    >
                      <option value="Fiery North East">Fiery North East</option>
                      <option value="Tangy & Aromatic">Tangy &amp; Aromatic</option>
                      <option value="Garlic & Herbs">Garlic &amp; Herbs</option>
                      <option value="Sweet & Tangy">Sweet &amp; Tangy</option>
                      <option value="Regional Specials">Regional Specials</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Base Price 250g (₹) *</label>
                    <input
                      type="number"
                      value={editingProduct.price || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Spice Level</label>
                    <select
                      value={editingProduct.spiceLevel || 'Medium'}
                      onChange={e => setEditingProduct({ ...editingProduct, spiceLevel: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                    >
                      <option value="Mild">Mild 🌿</option>
                      <option value="Medium">Medium 🌶️</option>
                      <option value="Hot">Hot 🔥</option>
                      <option value="Fiery Hot">Fiery Hot 🔥🔥</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Origin</label>
                    <input
                      type="text"
                      value={editingProduct.origin || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, origin: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Product Badge</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Select Product Image</label>
                  <select
                    value={editingProduct.image || '/images/bhut_jolokia_pickle.jpg'}
                    onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                  >
                    <option value="/images/bhut_jolokia_pickle.jpg">NE Roots Bhut Jolokia &amp; Khorisa Labeled Jar</option>
                    <option value="/images/kazi_nemu_pickle.jpg">NE Roots Assam Kazi Nemu Lime Labeled Jar</option>
                    <option value="/images/dalle_khursani_pickle.jpg">NE Roots Sikkim Dalle Khursani Labeled Jar</option>
                    <option value="/images/garlic_pickle.jpg">NE Roots Wild Hill Garlic Labeled Jar</option>
                    <option value="/images/mango_pickle.jpg">NE Roots Sun-Cured Mango Labeled Jar</option>
                    <option value="/images/red_chilli_pickle.jpg">NE Roots Banarasi Red Chilli Labeled Jar</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Ingredients (Comma separated)</label>
                  <input
                    type="text"
                    value={editingProduct.ingredientsStr || (Array.isArray(editingProduct.ingredients) ? editingProduct.ingredients.join(', ') : '')}
                    onChange={e => setEditingProduct({ ...editingProduct, ingredientsStr: e.target.value, ingredients: e.target.value.split(',').map(s => s.trim()) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Description</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 15,
                      fontWeight: 700
                    }}
                  >
                    💾 Save Changes Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    style={{
                      background: 'var(--bg-cream)',
                      color: 'var(--text-dark)',
                      border: '1px solid var(--border-color)',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT TEAM MEMBER MODAL */}
        {editingTeamMember && (
          <div
            className="responsive-modal-overlay"
            onClick={() => setEditingTeamMember(null)}
          >
            <div
              className="responsive-modal-box"
              style={{ maxWidth: 580 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, margin: 0 }}>✏️ Edit Team Member Profile</h2>
                <button onClick={() => setEditingTeamMember(null)} style={{ background: 'none', fontSize: 24, color: 'var(--text-muted)' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditTeamMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Full Name *</label>
                    <input
                      type="text"
                      value={editingTeamMember.name || ''}
                      onChange={e => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Role / Title *</label>
                    <input
                      type="text"
                      value={editingTeamMember.role || ''}
                      onChange={e => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Location</label>
                    <input
                      type="text"
                      value={editingTeamMember.location || ''}
                      onChange={e => setEditingTeamMember({ ...editingTeamMember, location: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Speciality / Focus</label>
                    <input
                      type="text"
                      value={editingTeamMember.speciality || ''}
                      onChange={e => setEditingTeamMember({ ...editingTeamMember, speciality: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Profile Image</label>
                  <select
                    value={editingTeamMember.image || '/images/ner_logo_icon.jpg'}
                    onChange={e => setEditingTeamMember({ ...editingTeamMember, image: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff' }}
                  >
                    <option value="/images/ner_logo_icon.jpg">NE Roots Brand Emblem</option>
                    <option value="/images/ne_roots_logo.jpg">NE Roots Tree Logo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Biography &amp; Contribution</label>
                  <textarea
                    rows={4}
                    value={editingTeamMember.bio || ''}
                    onChange={e => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 15,
                      fontWeight: 700
                    }}
                  >
                    💾 Update Team Profile Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTeamMember(null)}
                    style={{
                      background: 'var(--bg-cream)',
                      color: 'var(--text-dark)',
                      border: '1px solid var(--border-color)',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
