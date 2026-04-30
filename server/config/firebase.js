const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db = null;

try {
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    console.log('Firebase Admin initialized successfully.');
  } else {
    console.warn('⚠️ WARNING: serviceAccountKey.json not found. Firebase is NOT connected.');
    console.warn('Please download your service account key from the Firebase Console and place it in the server root folder.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

module.exports = { admin, db };
