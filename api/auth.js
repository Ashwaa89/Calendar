const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getAuthUrl, getTokensFromCode, getUserInfo, getUserCalendars } = require('./google-auth');
const { getFirestore, getAuth } = require('./firebase-config');

const PIN_REGEX = /^\d{4}$/;
const FEATURE_KEYS = [
  'overview',
  'calendar',
  'profiles',
  'tasks',
  'prizes',
  'meals',
  'inventory',
  'shopping',
  'help',
  'settings'
];
const DEFAULT_FEATURES = FEATURE_KEYS;

const DEFAULT_THEME = {
  name: 'Aurora',
  backgroundType: 'gradient',
  backgroundStart: '#667eea',
  backgroundEnd: '#764ba2',
  backgroundAngle: 135,
  panelBackground: '#ffffff',
  cardBackground: '#ffffff',
  sectionBackground: '#ffffff',
  sectionText: '#333333',
  sidebarBackground: 'rgba(255, 255, 255, 0.95)',
  headerText: '#333333',
  bodyText: '#666666',
  accent: '#667eea'
};

const DEFAULT_PIN_SETTINGS = {
  autoLockMinutes: 30,
  requiredActions: [
    'tasks:add',
    'tasks:complete',
    'tasks:edit',
    'tasks:delete',
    'tasks:assign',
    'profiles:edit',
    'prizes:manage',
    'inventory:manage',
    'meals:manage',
    'shopping:manage',
    'calendar:assign',
    'settings:calendar',
    'settings:features',
    'settings:theme',
    'settings:security'
  ]
};

const createPinHash = (pin) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return { salt, hash };
};

const verifyPinHash = (pin, salt, hash) => {
  const hashed = crypto.scryptSync(pin, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (stored.length !== hashed.length) return false;
  return crypto.timingSafeEqual(stored, hashed);
};

// Get Google OAuth URL
router.get('/google-auth-url', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle OAuth callback
router.post('/google-callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Get user info from Google
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Create or update user in Firestore
    const db = getFirestore();
    const userRef = db.collection('users').doc(userInfo.id);
    const existingDoc = await userRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : null;
    const adminPinSet = existingDoc.exists && !!existingData?.adminPinHash;
    const enabledFeatures = Array.isArray(existingData?.enabledFeatures)
      ? existingData.enabledFeatures
      : DEFAULT_FEATURES;
    const theme = existingData?.theme || DEFAULT_THEME;
    const pinSettings = existingData?.pinSettings || DEFAULT_PIN_SETTINGS;
    
    await userRef.set({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      enabledFeatures,
      theme,
      pinSettings,
      googleTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // Create custom Firebase token
    const customToken = await getAuth().createCustomToken(userInfo.id);
    
    res.json({
      success: true,
      customToken,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        adminPinSet,
        enabledFeatures,
        theme,
        pinSettings
      }
    });
  } catch (error) {
    const errorPayload = error?.response?.data || error?.response || error?.message || error;
    console.error('Error handling OAuth callback:', errorPayload);
    res.status(500).json({ error: 'Authentication failed', details: errorPayload });
  }
});

// Verify token and get user
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    const decodedToken = await getAuth().verifyIdToken(token);
    
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const enabledFeatures = Array.isArray(userData.enabledFeatures)
      ? userData.enabledFeatures
      : DEFAULT_FEATURES;
    const theme = userData.theme || DEFAULT_THEME;
    const pinSettings = userData.pinSettings || DEFAULT_PIN_SETTINGS;

    res.json({
      success: true,
      user: {
        id: decodedToken.uid,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        selectedCalendars: userData.selectedCalendars || [],
        adminPinSet: !!userData.adminPinHash,
        enabledFeatures,
        theme,
        pinSettings
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Set admin PIN
router.post('/set-admin-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    if (!PIN_REGEX.test(String(pin || ''))) {
      return res.status(400).json({ error: 'PIN must be a 4-digit number' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = userDoc.data();
    if (existing.adminPinHash) {
      return res.status(409).json({ error: 'Admin PIN already set' });
    }

    const { salt, hash } = createPinHash(String(pin));
    await userRef.set({
      adminPinSalt: salt,
      adminPinHash: hash,
      adminPinSetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting admin PIN:', error);
    res.status(500).json({ error: 'Failed to set admin PIN' });
  }
});

// Verify admin PIN
router.post('/verify-admin-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData.adminPinHash || !userData.adminPinSalt) {
      return res.json({ success: false, requiresSetup: true });
    }

    const pinOk = PIN_REGEX.test(String(pin || ''))
      && verifyPinHash(String(pin), userData.adminPinSalt, userData.adminPinHash);

    res.json({ success: pinOk, requiresSetup: false });
  } catch (error) {
    console.error('Error verifying admin PIN:', error);
    res.status(500).json({ error: 'Failed to verify admin PIN' });
  }
});

// Update enabled features
router.post('/set-enabled-features', async (req, res) => {
  try {
    const { userId, enabledFeatures } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const normalized = Array.isArray(enabledFeatures)
      ? enabledFeatures.filter(key => FEATURE_KEYS.includes(key))
      : [];

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.set({
      enabledFeatures: normalized,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, enabledFeatures: normalized });
  } catch (error) {
    console.error('Error updating enabled features:', error);
    res.status(500).json({ error: 'Failed to update enabled features' });
  }
});

// Update theme
router.post('/set-theme', async (req, res) => {
  try {
    const { userId, theme } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mergedTheme = { ...DEFAULT_THEME, ...(theme || {}) };

    await userRef.set({
      theme: mergedTheme,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, theme: mergedTheme });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Update pin settings
router.post('/set-pin-settings', async (req, res) => {
  try {
    const { userId, pinSettings } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mergedSettings = {
      ...DEFAULT_PIN_SETTINGS,
      ...(pinSettings || {})
    };

    await userRef.set({
      pinSettings: mergedSettings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, pinSettings: mergedSettings });
  } catch (error) {
    console.error('Error updating pin settings:', error);
    res.status(500).json({ error: 'Failed to update pin settings' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
