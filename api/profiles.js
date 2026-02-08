const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');

// Get all profiles for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    
    const profilesSnapshot = await db
      .collection('profiles')
      .where('parentUserId', '==', userId)
      .get();
    
    const profiles = [];
    profilesSnapshot.forEach(doc => {
      profiles.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ profiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Create a new profile
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar, age } = req.body;
    const db = getFirestore();
    
    const profileRef = await db.collection('profiles').add({
      parentUserId: userId,
      name,
      avatar: avatar || '🧒',
      age: age || null,
      stars: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const newProfile = await profileRef.get();
    res.json({ 
      success: true, 
      profile: { id: newProfile.id, ...newProfile.data() } 
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Update a profile
router.put('/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;
    const db = getFirestore();
    
    await db.collection('profiles').doc(profileId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete a profile
router.delete('/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const db = getFirestore();
    
    await db.collection('profiles').doc(profileId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;
