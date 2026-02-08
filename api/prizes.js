const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');

// Get all prizes for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    
    const prizesSnapshot = await db
      .collection('prizes')
      .where('userId', '==', userId)
      .get();
    
    const prizes = [];
    prizesSnapshot.forEach(doc => {
      prizes.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ prizes });
  } catch (error) {
    console.error('Error fetching prizes:', error);
    res.status(500).json({ error: 'Failed to fetch prizes' });
  }
});

// Create a new prize
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, starCost, icon } = req.body;
    const db = getFirestore();
    
    const prizeRef = await db.collection('prizes').add({
      userId,
      title,
      description: description || '',
      starCost: starCost || 10,
      icon: icon || '🎁',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const newPrize = await prizeRef.get();
    res.json({ 
      success: true, 
      prize: { id: newPrize.id, ...newPrize.data() } 
    });
  } catch (error) {
    console.error('Error creating prize:', error);
    res.status(500).json({ error: 'Failed to create prize' });
  }
});

// Redeem a prize
router.post('/redeem', async (req, res) => {
  try {
    const { prizeId, profileId } = req.body;
    const db = getFirestore();
    
    const prizeDoc = await db.collection('prizes').doc(prizeId).get();
    if (!prizeDoc.exists) {
      return res.status(404).json({ error: 'Prize not found' });
    }
    
    const prizeData = prizeDoc.data();
    const profileDoc = await db.collection('profiles').doc(profileId).get();
    const profileData = profileDoc.data();
    
    if (profileData.stars < prizeData.starCost) {
      return res.status(400).json({ error: 'Not enough stars' });
    }
    
    // Deduct stars
    await db.collection('profiles').doc(profileId).update({
      stars: profileData.stars - prizeData.starCost,
      updatedAt: new Date().toISOString()
    });
    
    // Record redemption
    await db.collection('redemptions').add({
      profileId,
      prizeId,
      prizeTitle: prizeData.title,
      starCost: prizeData.starCost,
      redeemedAt: new Date().toISOString()
    });
    
    res.json({ success: true, remainingStars: profileData.stars - prizeData.starCost });
  } catch (error) {
    console.error('Error redeeming prize:', error);
    res.status(500).json({ error: 'Failed to redeem prize' });
  }
});

// Delete a prize
router.delete('/:prizeId', async (req, res) => {
  try {
    const { prizeId } = req.params;
    const db = getFirestore();
    
    await db.collection('prizes').doc(prizeId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prize:', error);
    res.status(500).json({ error: 'Failed to delete prize' });
  }
});

module.exports = router;
