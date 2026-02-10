const express = require('express');
const router = express.Router();
const { getFirestore } = require('./firebase-config');

const TASK_COLLECTION = 'tasks';
const ASSIGNMENT_COLLECTION = 'taskAssignments';

// Get task catalog for a user
router.get('/catalog/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();

    const tasksSnapshot = await db
      .collection(TASK_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const tasks = [];
    tasksSnapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching task catalog:', error);
    res.status(500).json({ error: 'Failed to fetch task catalog' });
  }
});

// Get assigned tasks for a profile
router.get('/profile/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const db = getFirestore();

    const assignmentsSnapshot = await db
      .collection(ASSIGNMENT_COLLECTION)
      .where('profileId', '==', profileId)
      .get();

    const assignments = [];
    assignmentsSnapshot.forEach(doc => {
      assignments.push({ id: doc.id, ...doc.data() });
    });

    const tasks = await Promise.all(assignments.map(async (assignment) => {
      const taskDoc = await db.collection(TASK_COLLECTION).doc(assignment.taskId).get();
      if (!taskDoc.exists) return null;
      const taskData = taskDoc.data();
      return {
        id: assignment.id,
        taskId: assignment.taskId,
        profileId: assignment.profileId,
        availableAt: assignment.availableAt,
        completed: assignment.completed,
        lastCompletedAt: assignment.lastCompletedAt,
        assignmentCreatedAt: assignment.createdAt,
        assignmentUpdatedAt: assignment.updatedAt,
        ...taskData
      };
    }));

    res.json({ tasks: tasks.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ error: 'Failed to fetch assigned tasks' });
  }
});

// Create a new task in catalog (optionally assign to profile)
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, stars, frequency, frequencyUnit, profileId, quantity } = req.body;
    const db = getFirestore();
    const now = new Date().toISOString();

    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required' });
    }

    const taskRef = await db.collection(TASK_COLLECTION).add({
      userId,
      title,
      description: description || '',
      stars: stars || 1,
      quantity: Number.isFinite(Number(quantity)) ? Number(quantity) : 1,
      frequency: frequency || null,
      frequencyUnit: frequencyUnit || null, // 'hours', 'days', 'weeks'
      createdAt: now,
      updatedAt: now
    });

    let assignment = null;
    if (profileId) {
      const assignmentRef = await db.collection(ASSIGNMENT_COLLECTION).add({
        profileId,
        taskId: taskRef.id,
        completed: false,
        lastCompletedAt: null,
        availableAt: now,
        createdAt: now,
        updatedAt: now
      });
      assignment = { id: assignmentRef.id, profileId, taskId: taskRef.id };
    }

    const newTask = await taskRef.get();
    res.json({
      success: true,
      task: { id: newTask.id, ...newTask.data() },
      assignment
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Assign task to a profile
router.post('/assign', async (req, res) => {
  try {
    const { profileId, taskId } = req.body;
    const db = getFirestore();
    const now = new Date().toISOString();

    if (!profileId || !taskId) {
      return res.status(400).json({ error: 'profileId and taskId are required' });
    }

    const existing = await db
      .collection(ASSIGNMENT_COLLECTION)
      .where('profileId', '==', profileId)
      .where('taskId', '==', taskId)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      return res.json({ success: true, assignment: { id: doc.id, ...doc.data() } });
    }

    const assignmentRef = await db.collection(ASSIGNMENT_COLLECTION).add({
      profileId,
      taskId,
      completed: false,
      lastCompletedAt: null,
      availableAt: now,
      createdAt: now,
      updatedAt: now
    });

    const assignment = await assignmentRef.get();
    res.json({ success: true, assignment: { id: assignment.id, ...assignment.data() } });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Complete a task assignment
router.post('/complete/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const db = getFirestore();

    const assignmentDoc = await db.collection(ASSIGNMENT_COLLECTION).doc(assignmentId).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({ error: 'Task assignment not found' });
    }

    const assignmentData = assignmentDoc.data();
    const taskDoc = await db.collection(TASK_COLLECTION).doc(assignmentData.taskId).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskDoc.data();
    const now = new Date();

    // Calculate next available time if task has frequency
    let availableAt = now.toISOString();
    if (taskData.frequency && taskData.frequencyUnit) {
      const nextDate = new Date(now);
      switch (taskData.frequencyUnit) {
        case 'hours':
          nextDate.setHours(nextDate.getHours() + taskData.frequency);
          break;
        case 'days':
          nextDate.setDate(nextDate.getDate() + taskData.frequency);
          break;
        case 'weeks':
          nextDate.setDate(nextDate.getDate() + (taskData.frequency * 7));
          break;
      }
      availableAt = nextDate.toISOString();
    }

    await db.collection(ASSIGNMENT_COLLECTION).doc(assignmentId).update({
      completed: !taskData.frequency,
      lastCompletedAt: now.toISOString(),
      availableAt: availableAt,
      updatedAt: now.toISOString()
    });

    // Award stars to profile
    const profileDoc = await db.collection('profiles').doc(assignmentData.profileId).get();
    const profileData = profileDoc.data();
    await db.collection('profiles').doc(assignmentData.profileId).update({
      stars: (profileData.stars || 0) + taskData.stars,
      updatedAt: now.toISOString()
    });

    res.json({ success: true, starsEarned: taskData.stars });
  } catch (error) {
    console.error('Error completing task assignment:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Update a task in the catalog
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const db = getFirestore();

    await db.collection(TASK_COLLECTION).doc(taskId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Unassign a task from a profile
router.delete('/assign/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const db = getFirestore();

    await db.collection(ASSIGNMENT_COLLECTION).doc(assignmentId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error unassigning task:', error);
    res.status(500).json({ error: 'Failed to unassign task' });
  }
});

// Delete a task from the catalog (and all assignments)
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const db = getFirestore();

    const assignmentsSnapshot = await db
      .collection(ASSIGNMENT_COLLECTION)
      .where('taskId', '==', taskId)
      .get();

    const batch = db.batch();
    assignmentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    batch.delete(db.collection(TASK_COLLECTION).doc(taskId));
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
