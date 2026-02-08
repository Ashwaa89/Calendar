// Demo mode API endpoints - no Firebase required
const express = require('express');
const router = express.Router();

const nowIso = () => new Date().toISOString();
const normalizeKey = (name, unit) => `${(name || '').trim().toLowerCase()}|${(unit || 'unit').trim().toLowerCase()}`;
const mergeQuantities = (map, name, unit, qty) => {
  const key = normalizeKey(name, unit);
  const existing = map.get(key) || { name, unit, quantity: 0 };
  existing.quantity += Number(qty) || 0;
  map.set(key, existing);
};

// Mock user data
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: 'Demo User',
  picture: '👤'
};

// Mock profiles
const mockProfiles = [
  { id: 'profile-1', parentUserId: 'demo-user-123', name: 'Emma', avatar: '👧', color: '#ff6b6b', age: 8, stars: 45, createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'profile-2', parentUserId: 'demo-user-123', name: 'Lucas', avatar: '👦', color: '#4dabf7', age: 6, stars: 32, createdAt: nowIso(), updatedAt: nowIso() }
];

// Mock task catalog
const mockTaskCatalog = [
  { id: 'task-1', userId: 'demo-user-123', title: 'Clean Your Room', description: 'Make bed and organize toys', stars: 5, frequency: 1, frequencyUnit: 'days', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'task-2', userId: 'demo-user-123', title: 'Homework', description: 'Complete daily homework', stars: 10, frequency: 1, frequencyUnit: 'days', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'task-3', userId: 'demo-user-123', title: 'Brush Teeth', description: 'Morning and night', stars: 3, frequency: 12, frequencyUnit: 'hours', createdAt: nowIso(), updatedAt: nowIso() }
];

// Mock task assignments
const mockTaskAssignments = [
  { id: 'assign-1', profileId: 'profile-1', taskId: 'task-1', completed: false, lastCompletedAt: null, availableAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'assign-2', profileId: 'profile-1', taskId: 'task-2', completed: false, lastCompletedAt: null, availableAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'assign-3', profileId: 'profile-2', taskId: 'task-3', completed: false, lastCompletedAt: null, availableAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso() }
];

// Mock prizes
const mockPrizes = [
  { id: 'prize-1', userId: 'demo-user-123', title: 'Ice Cream Trip', description: 'Go get your favorite ice cream', starCost: 20, icon: '🍦', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'prize-2', userId: 'demo-user-123', title: 'Movie Night', description: 'Pick any movie to watch', starCost: 30, icon: '🎬', createdAt: nowIso(), updatedAt: nowIso() },
  { id: 'prize-3', userId: 'demo-user-123', title: 'New Toy', description: 'Choose a toy under $20', starCost: 50, icon: '🎁', createdAt: nowIso(), updatedAt: nowIso() }
];

// Mock calendars
const mockCalendars = [
  { id: 'cal-1', summary: 'Family Calendar', backgroundColor: '#039be5', selected: true },
  { id: 'cal-2', summary: 'Work Calendar', backgroundColor: '#7986cb', selected: false }
];

// Mock events
const mockEvents = [
  { id: 'event-1', summary: 'Soccer Practice', start: { dateTime: new Date(Date.now() + 86400000).toISOString() }, end: { dateTime: new Date(Date.now() + 90000000).toISOString() }, calendarId: 'cal-1' },
  { id: 'event-2', summary: 'Piano Lesson', start: { dateTime: new Date(Date.now() + 172800000).toISOString() }, end: { dateTime: new Date(Date.now() + 176400000).toISOString() }, calendarId: 'cal-1' }
];

const mockEventAssignments = [
  {
    id: 'cal-1__event-1',
    userId: 'demo-user-123',
    eventId: 'event-1',
    calendarId: 'cal-1',
    summary: 'Soccer Practice',
    start: mockEvents[0].start.dateTime,
    end: mockEvents[0].end.dateTime,
    startDate: new Date(mockEvents[0].start.dateTime).toISOString().split('T')[0],
    profileIds: ['profile-1']
  }
];

// Mock meals
const mockMeals = [
  { id: 'meal-1', userId: 'demo-user-123', date: new Date().toISOString().split('T')[0], mealType: 'breakfast', title: 'Pancakes', recipe: 'Homemade pancakes with syrup', ingredients: [
    { name: 'Flour', quantity: 2, unit: 'cups' },
    { name: 'Eggs', quantity: 3, unit: 'unit' },
    { name: 'Milk', quantity: 0.5, unit: 'L' }
  ], createdAt: nowIso() },
  { id: 'meal-2', userId: 'demo-user-123', date: new Date().toISOString().split('T')[0], mealType: 'dinner', title: 'Spaghetti', recipe: 'Spaghetti with meatballs', ingredients: [
    { name: 'Spaghetti', quantity: 0.5, unit: 'kg' },
    { name: 'Tomato Sauce', quantity: 1, unit: 'unit' }
  ], createdAt: nowIso() }
];

// Mock inventory
const mockInventory = [
  { id: 'inv-1', userId: 'demo-user-123', name: 'Milk', quantity: 1, unit: 'L', category: 'dairy', expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0], createdAt: nowIso() },
  { id: 'inv-2', userId: 'demo-user-123', name: 'Bread', quantity: 1, unit: 'loaf', category: 'bakery', expiryDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], createdAt: nowIso() }
];

// Mock shopping list (manual)
const mockShoppingList = [
  { id: 'shop-1', userId: 'demo-user-123', name: 'Yogurt', quantity: 2, unit: 'unit', purchased: false, createdAt: nowIso() },
  { id: 'shop-2', userId: 'demo-user-123', name: 'Eggs', quantity: 6, unit: 'unit', purchased: false, createdAt: nowIso() }
];

// Auth endpoints
// Admin PIN verification
router.post('/auth/verify-admin-pin', (req, res) => {
  const { pin } = req.body;
  const ADMIN_PIN = '1234';
  res.json({ success: pin === ADMIN_PIN });
});

router.get('/auth/demo-login', (req, res) => {
  res.json({ 
    success: true, 
    user: mockUser,
    token: 'demo-token-12345' 
  });
});

router.post('/auth/verify-token', (req, res) => {
  res.json({ success: true, user: mockUser });
});

// Profile endpoints
router.get('/profiles/:userId', (req, res) => {
  res.json({ success: true, profiles: mockProfiles });
});

router.post('/profiles/:userId', (req, res) => {
  const newProfile = {
    id: `profile-${Date.now()}`,
    parentUserId: req.params.userId,
    ...req.body,
    color: req.body.color || '#667eea',
    stars: 0,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockProfiles.push(newProfile);
  res.json({ success: true, profile: newProfile });
});

router.put('/profiles/:profileId', (req, res) => {
  const index = mockProfiles.findIndex(p => p.id === req.params.profileId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Profile not found' });
  }

  mockProfiles[index] = {
    ...mockProfiles[index],
    ...req.body,
    updatedAt: nowIso()
  };

  res.json({ success: true, profile: mockProfiles[index] });
});

router.delete('/profiles/:profileId', (req, res) => {
  const index = mockProfiles.findIndex(p => p.id === req.params.profileId);
  if (index > -1) mockProfiles.splice(index, 1);
  res.json({ success: true });
});

// Task endpoints
router.get('/tasks/catalog/:userId', (req, res) => {
  const tasks = mockTaskCatalog.filter(t => t.userId === req.params.userId);
  res.json({ success: true, tasks });
});

router.get('/tasks/profile/:profileId', (req, res) => {
  const assignments = mockTaskAssignments.filter(a => a.profileId === req.params.profileId);
  const tasks = assignments.map(a => {
    const task = mockTaskCatalog.find(t => t.id === a.taskId);
    if (!task) return null;
    return {
      id: a.id,
      taskId: a.taskId,
      profileId: a.profileId,
      availableAt: a.availableAt,
      completed: a.completed,
      lastCompletedAt: a.lastCompletedAt,
      assignmentCreatedAt: a.createdAt,
      assignmentUpdatedAt: a.updatedAt,
      ...task
    };
  }).filter(Boolean);

  res.json({ success: true, tasks });
});

router.post('/tasks', (req, res) => {
  const newTask = {
    id: `task-${Date.now()}`,
    userId: req.body.userId,
    title: req.body.title,
    description: req.body.description || '',
    stars: req.body.stars || 1,
    frequency: req.body.frequency || null,
    frequencyUnit: req.body.frequencyUnit || null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockTaskCatalog.push(newTask);

  let assignment = null;
  if (req.body.profileId) {
    assignment = {
      id: `assign-${Date.now()}`,
      profileId: req.body.profileId,
      taskId: newTask.id,
      completed: false,
      lastCompletedAt: null,
      availableAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    mockTaskAssignments.push(assignment);
  }

  res.json({ success: true, task: newTask, assignment });
});

router.post('/tasks/assign', (req, res) => {
  const existing = mockTaskAssignments.find(a => a.profileId === req.body.profileId && a.taskId === req.body.taskId);
  if (existing) return res.json({ success: true, assignment: existing });

  const assignment = {
    id: `assign-${Date.now()}`,
    profileId: req.body.profileId,
    taskId: req.body.taskId,
    completed: false,
    lastCompletedAt: null,
    availableAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockTaskAssignments.push(assignment);
  res.json({ success: true, assignment });
});

router.post('/tasks/complete/:assignmentId', (req, res) => {
  const assignment = mockTaskAssignments.find(a => a.id === req.params.assignmentId);
  if (!assignment) return res.status(404).json({ success: false, error: 'Task assignment not found' });

  const task = mockTaskCatalog.find(t => t.id === assignment.taskId);
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

  assignment.completed = !task.frequency;
  assignment.lastCompletedAt = nowIso();
  assignment.availableAt = nowIso();
  assignment.updatedAt = nowIso();

  const profile = mockProfiles.find(p => p.id === assignment.profileId);
  if (profile) profile.stars += task.stars;

  res.json({ success: true, starsEarned: task.stars, totalStars: profile ? profile.stars : 0 });
});

router.delete('/tasks/assign/:assignmentId', (req, res) => {
  const index = mockTaskAssignments.findIndex(a => a.id === req.params.assignmentId);
  if (index > -1) mockTaskAssignments.splice(index, 1);
  res.json({ success: true });
});

router.delete('/tasks/:taskId', (req, res) => {
  const taskIndex = mockTaskCatalog.findIndex(t => t.id === req.params.taskId);
  if (taskIndex > -1) mockTaskCatalog.splice(taskIndex, 1);

  for (let i = mockTaskAssignments.length - 1; i >= 0; i--) {
    if (mockTaskAssignments[i].taskId === req.params.taskId) {
      mockTaskAssignments.splice(i, 1);
    }
  }

  res.json({ success: true });
});

// Prize endpoints
router.get('/prizes/:userId', (req, res) => {
  res.json({ success: true, prizes: mockPrizes });
});

router.post('/prizes', (req, res) => {
  const newPrize = {
    id: `prize-${Date.now()}`,
    userId: req.body.userId,
    title: req.body.title,
    description: req.body.description,
    starCost: req.body.starCost,
    icon: req.body.icon,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  mockPrizes.push(newPrize);
  res.json({ success: true, prize: newPrize });
});

router.post('/prizes/redeem', (req, res) => {
  const { prizeId, profileId } = req.body;
  const prize = mockPrizes.find(p => p.id === prizeId);
  const profile = mockProfiles.find(p => p.id === profileId);
  
  if (!prize || !profile) {
    return res.status(404).json({ success: false, error: 'Prize or profile not found' });
  }
  
  if (profile.stars < prize.starCost) {
    return res.status(400).json({ success: false, error: 'Not enough stars' });
  }
  
  profile.stars -= prize.starCost;
  res.json({ success: true, remainingStars: profile.stars });
});

router.delete('/prizes/:prizeId', (req, res) => {
  const index = mockPrizes.findIndex(p => p.id === req.params.prizeId);
  if (index > -1) mockPrizes.splice(index, 1);
  res.json({ success: true });
});

// Calendar endpoints
router.get('/calendar/google-calendars/:userId', (req, res) => {
  res.json({ success: true, calendars: mockCalendars });
});

router.post('/calendar/events/:userId', (req, res) => {
  res.json({ success: true, events: mockEvents });
});

router.post('/calendar/save-selected/:userId', (req, res) => {
  res.json({ success: true });
});

router.get('/calendar/events/assignments/:userId', (req, res) => {
  const { userId } = req.params;
  const { timeMin, timeMax } = req.query;
  const startDate = timeMin ? new Date(timeMin).toISOString().split('T')[0] : null;
  const endDate = timeMax ? new Date(timeMax).toISOString().split('T')[0] : null;

  const assignments = mockEventAssignments.filter(a => {
    if (a.userId !== userId) return false;
    if (startDate && a.startDate < startDate) return false;
    if (endDate && a.startDate > endDate) return false;
    return true;
  });

  res.json({ success: true, assignments });
});

router.post('/calendar/events/assignments/:userId', (req, res) => {
  const { userId } = req.params;
  const { eventId, calendarId, start, end, summary, profileIds } = req.body;

  const docId = `${calendarId}__${eventId}`;
  const startDate = start ? new Date(start).toISOString().split('T')[0] : (end ? new Date(end).toISOString().split('T')[0] : null);
  const index = mockEventAssignments.findIndex(a => a.id === docId);

  const data = {
    id: docId,
    userId,
    eventId,
    calendarId,
    summary: summary || '',
    start: start || null,
    end: end || null,
    startDate,
    profileIds: Array.isArray(profileIds) ? profileIds : []
  };

  if (index === -1) {
    mockEventAssignments.push(data);
  } else {
    mockEventAssignments[index] = { ...mockEventAssignments[index], ...data };
  }

  res.json({ success: true });
});

// Meal endpoints
router.get('/meals/:userId', (req, res) => {
  res.json({ success: true, meals: mockMeals });
});

router.post('/meals', (req, res) => {
  const newMeal = {
    id: `meal-${Date.now()}`,
    ...req.body,
    createdAt: nowIso()
  };
  mockMeals.push(newMeal);
  res.json({ success: true, meal: newMeal });
});

router.delete('/meals/:mealId', (req, res) => {
  const index = mockMeals.findIndex(m => m.id === req.params.mealId);
  if (index > -1) mockMeals.splice(index, 1);
  res.json({ success: true });
});

// Inventory endpoints
router.get('/inventory/:userId', (req, res) => {
  res.json({ success: true, items: mockInventory });
});

router.post('/inventory', (req, res) => {
  const newItem = {
    id: `inv-${Date.now()}`,
    ...req.body,
    createdAt: nowIso()
  };
  mockInventory.push(newItem);
  res.json({ success: true, item: newItem });
});

router.delete('/inventory/:itemId', (req, res) => {
  const index = mockInventory.findIndex(i => i.id === req.params.itemId);
  if (index > -1) mockInventory.splice(index, 1);
  res.json({ success: true });
});

router.get('/inventory/shopping/:userId', (req, res) => {
  res.json({ success: true, items: mockShoppingList });
});

router.get('/inventory/shopping/auto/:userId', (req, res) => {
  const days = Math.max(parseInt(req.query.days || '7', 10), 1);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const requiredMap = new Map();
  mockMeals
    .filter(m => m.date >= startStr && m.date <= endStr)
    .forEach(meal => {
      (meal.ingredients || []).forEach(ing => {
        if (!ing) return;
        if (typeof ing === 'string') {
          mergeQuantities(requiredMap, ing, 'unit', 1);
          return;
        }
        mergeQuantities(requiredMap, ing.name, ing.unit || 'unit', ing.quantity || 1);
      });
    });

  const inventoryMap = new Map();
  mockInventory.forEach(item => mergeQuantities(inventoryMap, item.name, item.unit || 'unit', item.quantity || 0));

  const autoItems = [];
  requiredMap.forEach((required, key) => {
    const inventory = inventoryMap.get(key);
    const remaining = required.quantity - (inventory ? inventory.quantity : 0);
    if (remaining > 0) {
      autoItems.push({
        id: `auto-${key}`,
        userId: req.params.userId,
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
  mockShoppingList.forEach(item => mergeQuantities(combinedMap, item.name, item.unit, item.quantity));

  const combined = [];
  combinedMap.forEach((value, key) => {
    const hasAuto = autoItems.some(i => normalizeKey(i.name, i.unit) === key);
    const hasManual = mockShoppingList.some(i => normalizeKey(i.name, i.unit) === key);
    const source = hasAuto && hasManual ? 'mixed' : hasAuto ? 'auto' : 'manual';
    combined.push({
      id: `combined-${key}`,
      userId: req.params.userId,
      name: value.name,
      quantity: Math.round(value.quantity * 100) / 100,
      unit: value.unit || 'unit',
      purchased: false,
      source
    });
  });

  res.json({ success: true, items: combined });
});

router.post('/inventory/shopping', (req, res) => {
  const newItem = {
    id: `shop-${Date.now()}`,
    ...req.body,
    purchased: false,
    createdAt: nowIso()
  };
  mockShoppingList.push(newItem);
  res.json({ success: true, item: newItem });
});

module.exports = router;
