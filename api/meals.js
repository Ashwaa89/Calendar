const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');

// Get meal plan for a date range
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const db = getFirestore();
    
    let query = db.collection('mealPlans').where('userId', '==', userId);
    
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    
    const mealsSnapshot = await query.get();
    const meals = [];
    mealsSnapshot.forEach(doc => {
      meals.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ meals });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

// Add meal to plan
router.post('/', async (req, res) => {
  try {
    const { userId, date, mealType, title, recipe, ingredients } = req.body;
    const db = getFirestore();
    
    const mealRef = await db.collection('mealPlans').add({
      userId,
      date,
      mealType, // 'breakfast', 'lunch', 'dinner', 'snack'
      title,
      recipe: recipe || '',
      ingredients: ingredients || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const newMeal = await mealRef.get();
    res.json({ 
      success: true, 
      meal: { id: newMeal.id, ...newMeal.data() } 
    });
  } catch (error) {
    console.error('Error adding meal:', error);
    res.status(500).json({ error: 'Failed to add meal' });
  }
});

// Update meal
router.put('/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const updates = req.body;
    const db = getFirestore();
    
    await db.collection('mealPlans').doc(mealId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Delete meal
router.delete('/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const db = getFirestore();
    
    await db.collection('mealPlans').doc(mealId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

module.exports = router;
