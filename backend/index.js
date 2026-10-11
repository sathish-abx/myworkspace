import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Load environment variables
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK

/* Initialize Firebase Admin SDK */
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) return;

  let serviceAccount;

  // Option 1: Read credentials from the .env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();

    serviceAccount = rawKey.startsWith('{')
      ? JSON.parse(rawKey)
      : JSON.parse(Buffer.from(rawKey, 'base64').toString('utf8'));
  } else {
    // Option 2: Read credentials from a local JSON file
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');

    try {
      serviceAccount = JSON.parse(
        readFileSync(keyPath, 'utf8')
      );
    } catch (error) {
      throw new Error(
        'Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_KEY ' +
        'in .env or add backend/serviceAccountKey.json.'
      );
    }
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId:
      serviceAccount.project_id ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID,
  });

  console.log('Firebase Admin initialized with service account key');
};


initializeFirebaseAdmin();
const db = getFirestore();
const authAdmin = getAuth();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Public Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyWorkspace Backend API',
  });
});

// Authentication & Authorization Middleware
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);

    if (!decodedToken.email_verified) {
      return res.status(403).json({ error: 'Forbidden: Email address is not verified' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token', details: error.message });
  }
};

// ==========================================
// USER PROFILE ENDPOINTS
// ==========================================

// GET /api/profile/me - Get current user profile (or auto-initialize)
app.get('/api/profile/me', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // Auto-initialize profile for verified user
      const newProfile = {
        uid,
        fullName: req.user.name || req.user.email?.split('@')[0] || 'User',
        email: req.user.email || '',
        phone: '',
        bio: '',
        location: '',
        jobTitle: '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await userRef.set(newProfile);
      const createdDoc = await userRef.get();
      return res.status(200).json({
        ...createdDoc.data(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const data = doc.data();
    return res.json({
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    });
  } catch (error) {
    console.error('Error in GET /api/profile/me:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/profile - Create initial user profile
app.post('/api/profile', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fullName, phone, bio, location, jobTitle } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const userRef = db.collection('users').doc(uid);
    const existingDoc = await userRef.get();

    const profileData = {
      uid,
      fullName: fullName.trim(),
      email: req.user.email || '',
      phone: (phone || '').trim(),
      bio: (bio || '').trim(),
      location: (location || '').trim(),
      jobTitle: (jobTitle || '').trim(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!existingDoc.exists) {
      profileData.createdAt = FieldValue.serverTimestamp();
    }

    await userRef.set(profileData, { merge: true });
    const updatedDoc = await userRef.get();
    
    return res.status(200).json({
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.() ? updatedDoc.data().createdAt.toDate().toISOString() : updatedDoc.data()?.createdAt,
      updatedAt: updatedDoc.data()?.updatedAt?.toDate?.() ? updatedDoc.data().updatedAt.toDate().toISOString() : updatedDoc.data()?.updatedAt,
    });
  } catch (error) {
    console.error('Error in POST /api/profile:', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
});

// PATCH /api/profile/me - Update profile fields
app.patch('/api/profile/me', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fullName, phone, bio, location, jobTitle } = req.body;

    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({ error: 'Full name cannot be empty' });
      }
      updates.fullName = fullName.trim();
    }
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (location !== undefined) updates.location = String(location).trim();
    if (jobTitle !== undefined) updates.jobTitle = String(jobTitle).trim();

    const userRef = db.collection('users').doc(uid);
    await userRef.set(updates, { merge: true });

    const updatedDoc = await userRef.get();
    return res.json({
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate?.() ? updatedDoc.data().createdAt.toDate().toISOString() : updatedDoc.data()?.createdAt,
      updatedAt: updatedDoc.data()?.updatedAt?.toDate?.() ? updatedDoc.data().updatedAt.toDate().toISOString() : updatedDoc.data()?.updatedAt,
    });
  } catch (error) {
    console.error('Error in PATCH /api/profile/me:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// TASK MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/tasks - Get all tasks for authenticated user
app.get('/api/tasks', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const tasksSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .get();

    const tasks = tasksSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    });

    // Sort in memory by updatedAt descending
    tasks.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    return res.json(tasks);
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a single task
app.get('/api/tasks/:id', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;

    const taskDoc = await db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .doc(taskId)
      .get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const data = taskDoc.data();
    return res.json({
      id: taskDoc.id,
      title: data.title,
      description: data.description || '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    });
  } catch (error) {
    console.error('Error in GET /api/tasks/:id:', error);
    return res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    const taskStatus = validStatuses.includes(status) ? status : 'pending';

    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = validPriorities.includes(priority) ? priority : 'medium';

    const newTask = {
      title: title.trim(),
      description: (description || '').trim(),
      status: taskStatus,
      priority: taskPriority,
      dueDate: dueDate || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const taskRef = await db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .add(newTask);

    const createdDoc = await taskRef.get();
    const data = createdDoc.data();

    return res.status(201).json({
      id: taskRef.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - Update an existing task
app.patch('/api/tasks/:id', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;

    const taskRef = db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .doc(taskId);

    const doc = await taskRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, status, priority, dueDate } = req.body;
    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Task title cannot be empty' });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) updates.description = String(description).trim();

    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.status = status;
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      updates.priority = priority;
    }

    if (dueDate !== undefined) updates.dueDate = dueDate || null;

    await taskRef.update(updates);

    const updatedDoc = await taskRef.get();
    const data = updatedDoc.data();

    return res.json({
      id: updatedDoc.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    });
  } catch (error) {
    console.error('Error in PATCH /api/tasks/:id:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const taskId = req.params.id;

    const taskRef = db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .doc(taskId);

    const doc = await taskRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await taskRef.delete();
    return res.json({ message: 'Task deleted successfully', id: taskId });
  } catch (error) {
    console.error('Error in DELETE /api/tasks/:id:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/dashboard/stats - Calculate task summary statistics
app.get('/api/dashboard/stats', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const tasksSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('tasks')
      .get();

    const tasks = tasksSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    });

    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const in_progress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;

    // Top 5 most recently updated tasks
    tasks.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    const recentTasks = tasks.slice(0, 5);

    return res.json({
      stats: {
        total,
        pending,
        in_progress,
        completed,
      },
      recentTasks,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// DELETE /api/account - Delete current user account and data
app.delete('/api/account', verifyAuth, async (req, res) => {
  try {
    const uid = req.user.uid;

    // 1. Delete all user tasks
    const tasksSnapshot = await db.collection('users').doc(uid).collection('tasks').get();
    const batch = db.batch();
    tasksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // 2. Delete user profile doc
    await db.collection('users').doc(uid).delete();

    // 3. Delete Firebase Auth user
    await authAdmin.deleteUser(uid);

    return res.json({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/account:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
