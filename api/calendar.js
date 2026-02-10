const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');
const { getUserCalendars, getCalendarEvents } = require('./google-auth');

const ASSIGNMENTS_COLLECTION = 'eventAssignments';

const getDateOnly = (isoString) => {
  if (!isoString) return null;
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch (error) {
    return null;
  }
};

// Get user's Google calendars
router.get('/google-calendars/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const accessToken = userData.googleTokens?.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No Google access token found' });
    }
    
    const calendars = await getUserCalendars(accessToken);
    const selectedCalendars = Array.isArray(userData.selectedCalendars)
      ? userData.selectedCalendars
      : [];
    res.json({ calendars, selectedCalendars });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// Get events from selected calendars
router.post('/events/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { calendarIds, timeMin, timeMax } = req.body;
    const db = getFirestore();
    
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const accessToken = userData.googleTokens?.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No Google access token found' });
    }
    
    // Fetch events from all selected calendars
    const allEvents = [];
    for (const calendarId of calendarIds) {
      const events = await getCalendarEvents(accessToken, calendarId, timeMin, timeMax);
      allEvents.push(...events.map(event => ({ ...event, calendarId })));
    }
    
    res.json({ events: allEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Save selected calendars
router.post('/save-selected/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { selectedCalendars } = req.body;
    const db = getFirestore();
    
    await db.collection('users').doc(userId).update({
      selectedCalendars,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving selected calendars:', error);
    res.status(500).json({ error: 'Failed to save calendars' });
  }
});

// Get event assignments for a date range
router.get('/events/assignments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeMin, timeMax } = req.query;
    const db = getFirestore();

    let query = db.collection(ASSIGNMENTS_COLLECTION).where('userId', '==', userId);
    const startDate = getDateOnly(timeMin);
    const endDate = getDateOnly(timeMax);

    if (startDate) {
      query = query.where('startDate', '>=', startDate);
    }
    if (endDate) {
      query = query.where('startDate', '<=', endDate);
    }

    const [snapshot, seriesSnapshot] = await Promise.all([
      query.get(),
      db.collection(ASSIGNMENTS_COLLECTION)
        .where('userId', '==', userId)
        .where('applyToSeries', '==', true)
        .get()
    ]);

    const assignmentsMap = new Map();
    snapshot.forEach(doc => {
      assignmentsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    seriesSnapshot.forEach(doc => {
      if (!assignmentsMap.has(doc.id)) {
        assignmentsMap.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });

    const assignments = Array.from(assignmentsMap.values());

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching event assignments:', error);
    res.status(500).json({ error: 'Failed to fetch event assignments' });
  }
});

// Assign event to profiles
router.post('/events/assignments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { eventId, calendarId, start, end, summary, profileIds, recurringEventId, applyToSeries } = req.body;
    const db = getFirestore();

    if (!eventId || !calendarId) {
      return res.status(400).json({ error: 'eventId and calendarId are required' });
    }

    const startDate = getDateOnly(start) || getDateOnly(end) || null;
    const seriesMode = !!applyToSeries && !!recurringEventId;
    const docId = seriesMode
      ? `${calendarId}__series__${recurringEventId}`
      : `${calendarId}__${eventId}`;

    await db.collection(ASSIGNMENTS_COLLECTION).doc(docId).set({
      userId,
      eventId,
      recurringEventId: recurringEventId || null,
      calendarId,
      summary: summary || '',
      start: start || null,
      end: end || null,
      startDate,
      profileIds: Array.isArray(profileIds) ? profileIds : [],
      applyToSeries: seriesMode,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Notify via WebSocket
    if (req.app.locals.broadcastToUser) {
      req.app.locals.broadcastToUser(userId, {
        type: 'update',
        scope: 'calendar',
        action: 'event-assignment-updated'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving event assignment:', error);
    res.status(500).json({ error: 'Failed to save event assignment' });
  }
});

module.exports = router;
