const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokensFromCode, getUserInfo, getUserCalendars } = require('./google-auth');
const { getFirestore, getAuth } = require('./firebase-config');

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
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Get user info from Google
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Create or update user in Firestore
    const db = getFirestore();
    const userRef = db.collection('users').doc(userInfo.id);
    
    await userRef.set({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
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
        picture: userInfo.picture
      }
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
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
    
    res.json({ 
      success: true, 
      user: { 
        id: decodedToken.uid, 
        ...userDoc.data() 
      } 
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
