const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!db) {
    return res.status(503).json({ error: 'Database not connected (Firebase).' });
  }

  try {
    // Check if user exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to Firestore
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    const docRef = await usersRef.add(newUser);
    const userId = docRef.id;

    // Return jsonwebtoken
    const payload = { user: { id: userId } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: userId, name, email } });
      }
    );
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!db) {
    return res.status(503).json({ error: 'Database not connected (Firebase).' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const payload = { user: { id: userId } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: userId, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Database not connected (Firebase).' });

  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    delete userData.password; // Don't send back password
    
    res.json({ id: userDoc.id, ...userData });
  } catch (err) {
    console.error('Fetch Me Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
