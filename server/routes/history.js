const express = require('express');
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/history
// Fetch past resume analysis reports
router.get('/', auth, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected (Firebase).' 
      });
    }

    // Fetch all analysis records for the user, sorted by newest first
    // Limiting to 50 for performance
    const snapshot = await db.collection('analyses')
      .where('userId', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        _id: doc.id,
        fileName: data.fileName,
        score: data.score,
        createdAt: data.createdAt
      });
    });

    return res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    // Note: Firestore requires a composite index for where() + orderBy() on different fields.
    // If it fails, the console error will provide a direct link to create it.
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve analysis history. Make sure Firestore indexes are built.' 
    });
  }
});

// GET /api/history/:id
// Fetch a specific detailed report
router.get('/:id', auth, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not connected.' });
    }

    const docRef = db.collection('analyses').doc(req.params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = docSnap.data();

    if (report.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this report' });
    }

    return res.json({ success: true, data: { _id: docSnap.id, ...report } });
  } catch (error) {
    console.error('Error fetching report detail:', error);
    return res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

module.exports = router;
