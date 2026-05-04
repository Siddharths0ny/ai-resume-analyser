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

const { sendResetEmail } = require('../utils/email');

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!db) {
    return res.status(503).json({ error: 'Database not connected (Firebase).' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      // Don't reveal if email exists
      return res.status(200).json({ message: 'If email exists, reset link sent. Check your inbox.' });
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Generate reset token
    const payload = { 
      reset: true, 
      id: userId 
    };
    const resetToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '1h' }
    );

    // Update user with reset token & expiry
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.collection('users').doc(userId).update({
      resetToken,
      resetTokenExpiry: expiry.toISOString()
    });

    // Send email
    const resetUrl = `${req.headers.origin || 'http://localhost:5173'}/#reset?token=${resetToken}`;
    const emailSent = await sendResetEmail(email, resetUrl);

    if (!emailSent) {
      console.log(`Dev fallback - Reset token for ${email}: ${resetToken} (URL: ${resetUrl})`);
    }

    res.status(200).json({ message: 'If email exists, reset link sent. Check your inbox.' });
  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!db) {
    return res.status(503).json({ error: 'Database not connected (Firebase).' });
  }

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
    
    if (!decoded.reset || !decoded.id) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const now = new Date();
    const expiry = new Date(userData.resetTokenExpiry);

    if (!userData.resetToken || userData.resetToken !== token || now > expiry) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password, clear reset fields
    await db.collection('users').doc(decoded.id).update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token expired' });
    }
    console.error('Reset Password Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
