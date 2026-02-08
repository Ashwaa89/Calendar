const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp;

function initializeFirebase() {
  if (!firebaseApp) {
    try {
      // For local development with service account file
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        // For production with environment variables
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined;

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
      }
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
  return firebaseApp;
}

function getFirestore() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

function getAuth() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};
