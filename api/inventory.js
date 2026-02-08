const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');

const normalizeKey = (name, unit) => `${(name || '').trim().toLowerCase()}|${(unit || 'unit').trim().toLowerCase()}`;

const mergeQuantities = (map, name, unit, qty) => {
  const key = normalizeKey(name, unit);
  const existing = map.get(key) || { name, unit, quantity: 0 };
  existing.quantity += Number(qty) || 0;
  map.set(key, existing);
};

// Get inventory items
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    
    const inventorySnapshot = await db
      .collection('inventory')
      .where('userId', '==', userId)
      .get();
    
    const items = [];
    inventorySnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ items });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add inventory item
router.post('/', async (req, res) => {
  try {
    const { userId, name, quantity, unit, category, expiryDate } = req.body;
    const db = getFirestore();
    
    const itemRef = await db.collection('inventory').add({
      userId,
      name,
      quantity: quantity || 1,
      unit: unit || 'unit',
      category: category || 'other',
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const newItem = await itemRef.get();
    res.json({ 
      success: true, 
      item: { id: newItem.id, ...newItem.data() } 
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update inventory item
router.put('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    const db = getFirestore();
    
    await db.collection('inventory').doc(itemId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete inventory item
router.delete('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const db = getFirestore();
    
    await db.collection('inventory').doc(itemId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get shopping list (items below threshold or marked for shopping)
router.get('/shopping/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    
    const shoppingSnapshot = await db
      .collection('shoppingList')
      .where('userId', '==', userId)
      .where('purchased', '==', false)
      .get();
    
    const items = [];
    shoppingSnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ items });
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// Get auto shopping list based on upcoming meals and inventory
router.get('/shopping/auto/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const days = Math.max(parseInt(req.query.days || '7', 10), 1);
    const db = getFirestore();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const mealsSnapshot = await db
      .collection('mealPlans')
      .where('userId', '==', userId)
      .where('date', '>=', startStr)
      .where('date', '<=', endStr)
      .get();

    const inventorySnapshot = await db
      .collection('inventory')
      .where('userId', '==', userId)
      .get();

    const shoppingSnapshot = await db
      .collection('shoppingList')
      .where('userId', '==', userId)
      .where('purchased', '==', false)
      .get();

    const requiredMap = new Map();
    mealsSnapshot.forEach(doc => {
      const meal = doc.data();
      const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

      ingredients.forEach(ing => {
        if (!ing) return;
        if (typeof ing === 'string') {
          mergeQuantities(requiredMap, ing, 'unit', 1);
          return;
        }
        mergeQuantities(requiredMap, ing.name, ing.unit || 'unit', ing.quantity || 1);
      });
    });

    const inventoryMap = new Map();
    inventorySnapshot.forEach(doc => {
      const item = doc.data();
      mergeQuantities(inventoryMap, item.name, item.unit || 'unit', item.quantity || 0);
    });

    const manualMap = new Map();
    const manualItems = [];
    shoppingSnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data(), source: 'manual' };
      manualItems.push(item);
      mergeQuantities(manualMap, item.name, item.unit || 'unit', item.quantity || 0);
    });

    const autoItems = [];
    requiredMap.forEach((required, key) => {
      const inventory = inventoryMap.get(key);
      const remaining = required.quantity - (inventory ? inventory.quantity : 0);
      if (remaining > 0) {
        autoItems.push({
          id: `auto-${key}`,
          userId,
          name: required.name,
          quantity: Math.round(remaining * 100) / 100,
          unit: required.unit || 'unit',
          purchased: false,
          source: 'auto'
        });
      }
    });

    const combinedMap = new Map();
    autoItems.forEach(item => mergeQuantities(combinedMap, item.name, item.unit, item.quantity));
    manualItems.forEach(item => mergeQuantities(combinedMap, item.name, item.unit, item.quantity));

    const combined = [];
    combinedMap.forEach((value, key) => {
      const hasAuto = autoItems.some(i => normalizeKey(i.name, i.unit) === key);
      const hasManual = manualItems.some(i => normalizeKey(i.name, i.unit) === key);
      const source = hasAuto && hasManual ? 'mixed' : hasAuto ? 'auto' : 'manual';

      combined.push({
        id: `combined-${key}`,
        userId,
        name: value.name,
        quantity: Math.round(value.quantity * 100) / 100,
        unit: value.unit || 'unit',
        purchased: false,
        source
      });
    });

    res.json({ items: combined });
  } catch (error) {
    console.error('Error building auto shopping list:', error);
    res.status(500).json({ error: 'Failed to build auto shopping list' });
  }
});

// Add to shopping list
router.post('/shopping', async (req, res) => {
  try {
    const { userId, name, quantity, unit } = req.body;
    const db = getFirestore();
    
    const itemRef = await db.collection('shoppingList').add({
      userId,
      name,
      quantity: quantity || 1,
      unit: unit || 'unit',
      purchased: false,
      createdAt: new Date().toISOString()
    });
    
    const newItem = await itemRef.get();
    res.json({ 
      success: true, 
      item: { id: newItem.id, ...newItem.data() } 
    });
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    res.status(500).json({ error: 'Failed to add to shopping list' });
  }
});

module.exports = router;
