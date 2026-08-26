import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data.json');

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "NE Roots Assam Bhut Jolokia & Bamboo Shoot Pickle (Khorisa)",
    shortName: "Ghost Pepper & Khorisa",
    category: "Fiery North East",
    price: 299,
    prices: { "250g": 299, "500g": 549, "1kg": 999 },
    description: "The pride of Assam. World-famous fiery Bhut Jolokia (Ghost Peppers) hand-pounded with tender fermented bamboo shoot (Khorisa) and steeped in pure cold-pressed mustard oil.",
    spiceLevel: "Fiery Hot",
    spiceRating: 4,
    image: "/images/bhut_jolokia_pickle.jpg",
    badge: "Assam Signature 🔥",
    origin: "Tezpur, Assam",
    ingredients: ["Fresh Assam Bhut Jolokia Chillies", "Fermented Bamboo Shoot (Khorisa)", "Cold-Pressed Mustard Oil", "Ginger", "Garlic", "Rock Salt", "Traditional Assamese Spices"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  },
  {
    id: 2,
    name: "NE Roots Assam Nemu (King Lime) & Mustard Oil Pickle",
    shortName: "Assam Nemu Lime",
    category: "Tangy & Aromatic",
    price: 249,
    prices: { "250g": 249, "500g": 449, "1kg": 799 },
    description: "Geographical Indication (GI) tagged Assam Nemu lemons known for their intense floral citrus aroma, cured in golden yellow mustard paste, organic turmeric, and cold-pressed oil.",
    spiceLevel: "Mild",
    spiceRating: 1,
    image: "/images/kazi_nemu_pickle.jpg",
    badge: "GI Tagged Assam Lemon 🍋",
    origin: "Golaghat, Assam",
    ingredients: ["Fresh Assam Nemu (King Lemon)", "Yellow Mustard Paste", "Mustard Oil", "Turmeric", "Green Chilli", "Black Salt", "Ajwain"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  },
  {
    id: 3,
    name: "NE Roots Sikkim Dalle Khursani Round Cherry Chilli Pickle",
    shortName: "Dalle Khursani Pickle",
    category: "Fiery North East",
    price: 289,
    prices: { "250g": 289, "500g": 519, "1kg": 949 },
    description: "Vibrant round red Dalle Khursani cherry peppers from the Eastern Himalayas. Bursting with robust pungent heat and fermented in mustard oil with Himalayan mountain herbs.",
    spiceLevel: "Hot",
    spiceRating: 3,
    image: "/images/dalle_khursani_pickle.jpg",
    badge: "Himalayan Classic 🌶️",
    origin: "Sikkim / NE Hills",
    ingredients: ["Whole Dalle Khursani Chillies", "Cold-Pressed Mustard Oil", "Split Yellow Mustard", "Fenugreek", "Himalayan Pink Salt", "Spices"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  },
  {
    id: 4,
    name: "NE Roots Wild Hill Garlic & Mustard Seed Achaar",
    shortName: "Wild Hill Garlic",
    category: "Garlic & Herbs",
    price: 269,
    prices: { "250g": 269, "500g": 489, "1kg": 879 },
    description: "Whole peeled aromatic mountain garlic cloves tempered with split yellow mustard seeds, Naga ginger, Kashmiri red chilli, and steeped in virgin cold-pressed mustard oil.",
    spiceLevel: "Medium",
    spiceRating: 2,
    image: "/images/garlic_pickle.jpg",
    badge: "Immunity Booster 🧄",
    origin: "Meghalaya Hills",
    ingredients: ["Hill Garlic Cloves", "Yellow Mustard Seeds", "Virgin Mustard Oil", "Ginger Paste", "Turmeric", "Hing", "Sea Salt"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  },
  {
    id: 5,
    name: "NE Roots Sun-Cured Raw Mango & Bhoot Jolokia Fusion",
    shortName: "Mango & Ghost Pepper",
    category: "Sweet & Tangy",
    price: 259,
    prices: { "250g": 259, "500g": 469, "1kg": 849 },
    description: "Crisp raw Indian mangoes sun-dried for 14 days and infused with a touch of Assam Ghost Pepper for a tantalizing kick that balances traditional mango sourness.",
    spiceLevel: "Medium",
    spiceRating: 2,
    image: "/images/mango_pickle.jpg",
    badge: "Customer Favourite ⭐",
    origin: "Jorhat, Assam",
    ingredients: ["Raw Mango Chunks", "Mustard Oil", "Bhut Jolokia Powder", "Fennel", "Fenugreek", "Kalonji", "Rock Salt"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  },
  {
    id: 6,
    name: "NE Roots Banarasi Bharwa Lal Mirch with Assam Mustard",
    shortName: "Stuffed Red Chilli",
    category: "Regional Specials",
    price: 299,
    prices: { "250g": 299, "500g": 549, "1kg": 999 },
    description: "Thick hand-selected red chillies generously stuffed with tangy amchur, freshly ground roasted spices, and slow-matured in aromatic Assamese mustard oil.",
    spiceLevel: "Hot",
    spiceRating: 3,
    image: "/images/red_chilli_pickle.jpg",
    badge: "Heritage Recipe 🏺",
    origin: "Varanasi / Assam",
    ingredients: ["Fresh Red Chillies", "Assam Mustard Oil", "Amchur (Dry Mango)", "Coriander", "Cumin", "Ajwain", "Black Salt"],
    rating: 5.0,
    reviewCount: 0,
    inStock: true,
    featured: true
  }
];

const INITIAL_ORDERS = [];

const INITIAL_REVIEWS = [];

const INITIAL_TEAM = [
  {
    id: 1,
    name: "Soumarjyoti Bhuyan",
    role: "Co-Founder & Managing Director",
    bio: "Passionate about preserving indigenous culinary traditions of Assam and scaling North Eastern FMCG treasures globally.",
    image: "/images/ner_logo_icon.jpg",
    location: "Guwahati, Assam",
    speciality: "Brand Vision & Regional Heritage"
  },
  {
    id: 2,
    name: "Utpalaa B Bhuyan",
    role: "Founder & Master Food Technologist & Kitchen Lead",
    bio: "Over 12 years perfecting ancestral Assamese sun-curing methods, mustard oil tempering, and GI-tagged citrus preservation. Ensuring every jar meets pristine FSSAI hygienic standards.",
    image: "/images/ner_logo_icon.jpg",
    location: "Nagaon / Guwahati, Assam",
    speciality: "Traditional Fermentation & Quality Control"
  },
  {
    id: 3,
    name: "Lakshyajyoti Bhuyan",
    role: "Head of Farmer Partnerships & Sourcing",
    bio: "Directly partnering with smallholder farming clusters in Tezpur and Golaghat for fresh Bhut Jolokia, organic Nemu lemons, and wild mountain garlic, ensuring fair trade and zero middlemen.",
    image: "/images/ner_logo_icon.jpg",
    location: "Nagaon/Guwahati, Assam",
    speciality: "Direct Farmer Sourcing & Sustainable Agriculture"
  }
];

const INITIAL_COMPANY_STORY = {
  headline: "Rooted in Assam, Dedicated to North Eastern Heritage",
  narrative: "NE Roots (North East Roots) was born out of a profound passion to celebrate and share the untapped culinary biodiversity of North East India. From the mist-laden hills of Assam to the fertile riverbanks of the Brahmaputra, our recipes are rooted in age-old family traditions, sun-curing practices, and authentic spices.",
  mission: "Our mission is to create a globally recognized North Eastern FMCG brand that delivers uncompromising taste, 100% vegetarian purity, and genuine regional heritage while empowering local Assamese farmers and rural communities.",
  commitments: [
    "100% Sourced within North East India",
    "No Chemical Preservatives or Synthetic Colours",
    "Fair-Trade Direct Farm Partnerships",
    "FSSAI Certified Hygienic Processing (Lic: 20326101000625)"
  ]
};

const INITIAL_ADMIN_USERS = [
  {
    email: "utpalabhuyan29@gmail.com",
    name: "Utpala Bhuyan",
    role: "Owner / Super Admin",
    avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    addedAt: "2026-08-25",
    isGoogleVerified: true
  },
  {
    email: "soumarjyotibhuyan@gmail.com",
    name: "Soumarjyoti Bhuyan",
    role: "Store Administrator",
    avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    addedAt: "2026-08-25",
    isGoogleVerified: true
  }
];

if (typeof global !== 'undefined') {
  if (!global._neroots_db) global._neroots_db = null;
  if (!global._neroots_admin_whitelist) global._neroots_admin_whitelist = new Map();
}

/**
 * Merge environment variable admin emails (ADMIN_EMAILS / NEXT_PUBLIC_ADMIN_EMAILS)
 * and global in-memory whitelist into the db.adminUsers array.
 */
export function syncAdminUsers(db) {
  if (!db) return;
  db.adminUsers = db.adminUsers || [];

  // 1. Ensure initial admins are present
  for (const initAdmin of INITIAL_ADMIN_USERS) {
    if (!db.adminUsers.some(u => u.email.toLowerCase().trim() === initAdmin.email.toLowerCase().trim())) {
      db.adminUsers.push({ ...initAdmin });
    }
  }

  // 2. Parse process.env.ADMIN_EMAILS & NEXT_PUBLIC_ADMIN_EMAILS
  const envEmails = [
    process.env.ADMIN_EMAILS || '',
    process.env.NEXT_PUBLIC_ADMIN_EMAILS || '',
    'soumarjyotibhuyan@gmail.com,utpalabhuyan29@gmail.com'
  ].join(',').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  for (const email of envEmails) {
    if (!db.adminUsers.some(u => u.email.toLowerCase().trim() === email)) {
      db.adminUsers.push({
        email,
        name: email.split('@')[0],
        role: email.includes('soumarjyoti') || email.includes('utpala') ? 'Owner / Super Admin' : 'Store Administrator',
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        addedAt: new Date().toISOString().split('T')[0],
        isGoogleVerified: true
      });
    }
  }

  // 3. Merge from global memory whitelist
  if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
    for (const [emailKey, adminObj] of global._neroots_admin_whitelist.entries()) {
      if (!db.adminUsers.some(u => u.email.toLowerCase().trim() === emailKey)) {
        db.adminUsers.push({ ...adminObj });
      }
    }
  }
}

function getDataPath() {
  if (process.env.VERCEL) {
    const tmpPath = path.join('/tmp', 'data.json');
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(dataPath)) {
          fs.copyFileSync(dataPath, tmpPath);
        }
      } catch (e) {
        console.warn('Could not copy data.json to /tmp:', e);
      }
    }
    return tmpPath;
  }
  return dataPath;
}

export function updateProductRatings(db) {
  if (!db || !Array.isArray(db.products)) return;
  const reviews = Array.isArray(db.reviews) ? db.reviews : [];

  for (const product of db.products) {
    const pName = (product.name || '').toLowerCase();
    const pShort = (product.shortName || '').toLowerCase();

    const matchingReviews = reviews.filter(r => {
      if (r.productId && String(r.productId) === String(product.id)) return true;
      const flavour = (r.flavour || '').toLowerCase();
      if (!flavour) return false;
      if (flavour === pName || flavour === pShort) return true;
      if (pName.includes(flavour) || flavour.includes(pShort)) return true;
      if (pShort.includes('bhut') && flavour.includes('bhut')) return true;
      if (pShort.includes('nemu') && flavour.includes('nemu')) return true;
      if (pShort.includes('dalle') && flavour.includes('dalle')) return true;
      if (pShort.includes('garlic') && flavour.includes('garlic')) return true;
      if (pShort.includes('mango') && flavour.includes('mango')) return true;
      if (pShort.includes('red chilli') && (flavour.includes('chilli') || flavour.includes('bharwa'))) return true;
      return false;
    });

    if (matchingReviews.length === 0) {
      product.rating = 0;
      product.reviewCount = 0;
    } else {
      const sum = matchingReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      product.rating = parseFloat((sum / matchingReviews.length).toFixed(2));
      product.reviewCount = matchingReviews.length;
    }
  }
}

export function getDB() {
  try {
    const targetPath = getDataPath();
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf8');
      const data = JSON.parse(content);
      if (!data.products) data.products = INITIAL_PRODUCTS;
      if (!data.orders) data.orders = INITIAL_ORDERS;
      if (!data.reviews) data.reviews = INITIAL_REVIEWS;
      if (!data.team) data.team = INITIAL_TEAM;
      if (!data.companyStory) data.companyStory = INITIAL_COMPANY_STORY;
      if (!data.adminUsers) data.adminUsers = INITIAL_ADMIN_USERS;
      syncAdminUsers(data);
      updateProductRatings(data);
      if (typeof global !== 'undefined') global._neroots_db = data;
      return data;
    }

    if (typeof global !== 'undefined' && global._neroots_db) {
      syncAdminUsers(global._neroots_db);
      return global._neroots_db;
    }

    const initialData = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      reviews: INITIAL_REVIEWS,
      team: INITIAL_TEAM,
      companyStory: INITIAL_COMPANY_STORY,
      adminUsers: INITIAL_ADMIN_USERS
    };
    syncAdminUsers(initialData);

    try {
      fs.writeFileSync(targetPath, JSON.stringify(initialData, null, 2), 'utf8');
    } catch (e) {}

    if (typeof global !== 'undefined') global._neroots_db = initialData;
    return initialData;
  } catch (err) {
    console.error('Error reading DB:', err);
    if (typeof global !== 'undefined' && global._neroots_db) {
      return global._neroots_db;
    }
    return {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      reviews: INITIAL_REVIEWS,
      team: INITIAL_TEAM,
      companyStory: INITIAL_COMPANY_STORY,
      adminUsers: INITIAL_ADMIN_USERS
    };
  }
}

export function saveDB(data) {
  if (typeof global !== 'undefined') {
    global._neroots_db = data;
  }
  try {
    const targetPath = getDataPath();
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
    // Also try writing to local dataPath if different from tmpPath and not in readonly mode
    if (targetPath !== dataPath && !process.env.VERCEL && fs.existsSync(dataPath)) {
      try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Could not persist to disk, stored in memory cache:', err.message);
  }
}

/**
 * Synchronize full store state from client admin backup or cloud sync
 */
export function syncFullStoreState(incomingData = {}) {
  const db = getDB();
  let changed = false;

  if (Array.isArray(incomingData.products) && incomingData.products.length > 0) {
    db.products = incomingData.products;
    changed = true;
  }

  if (Array.isArray(incomingData.team) && incomingData.team.length > 0) {
    db.team = incomingData.team;
    changed = true;
  }

  if (incomingData.companyStory && typeof incomingData.companyStory === 'object') {
    db.companyStory = { ...db.companyStory, ...incomingData.companyStory };
    changed = true;
  }

  if (Array.isArray(incomingData.reviews) && incomingData.reviews.length > 0) {
    db.reviews = incomingData.reviews;
    changed = true;
  }

  if (Array.isArray(incomingData.orders)) {
    // Preserve any existing orders on the server that might be missing in client's stale snapshot
    const existingOrdersMap = new Map((db.orders || []).map(o => [String(o.id), o]));
    
    for (const incomingOrder of incomingData.orders) {
      if (incomingOrder && incomingOrder.id) {
        const orderIdStr = String(incomingOrder.id);
        const existingOrder = existingOrdersMap.get(orderIdStr);
        if (existingOrder) {
          existingOrdersMap.set(orderIdStr, { ...existingOrder, ...incomingOrder });
        } else {
          existingOrdersMap.set(orderIdStr, incomingOrder);
        }
      }
    }
    
    db.orders = Array.from(existingOrdersMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    changed = true;
  }

  if (Array.isArray(incomingData.adminUsers) && incomingData.adminUsers.length > 0) {
    for (const user of incomingData.adminUsers) {
      if (user?.email && !db.adminUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        db.adminUsers.push({ ...user });
      }
    }
    syncAdminUsers(db);
    changed = true;
  }

  db.lastSyncedAt = incomingData.timestamp || Date.now();
  updateProductRatings(db);
  if (changed) {
    saveDB(db);
  }
  return db;
}