// Replace with your actual Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDH3nbcfWlHrevnA4SN24IE480tGaPTDfg",
  authDomain: "ashwaa-calendar.firebaseapp.com",
  projectId: "ashwaa-calendar",
  storageBucket: "ashwaa-calendar.firebasestorage.app",
  messagingSenderId: "1042500813557",
  appId: "1:1042500813557:web:1c185aaafa3e832f297bbc"
};

// Use relative path for production, localhost for dev
export const apiUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
  ? 'http://localhost:3000/api'
  : '/api';

// Set to true to use demo mode (no Firebase/Google auth required)
export const demoMode = false;
