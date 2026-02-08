# Family Calendar App - Complete Setup & Deployment Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Google Cloud Console Setup](#google-cloud-setup)
5. [Local Development Setup](#local-development)
6. [Vercel Deployment](#vercel-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This is a full-stack family management application built with:
- **Frontend**: Angular 17 (standalone components)
- **Backend**: Node.js + Express
- **Database**: Google Firestore
- **Authentication**: Google OAuth 2.0 + Firebase Auth
- **Calendar Integration**: Google Calendar API
- **Hosting**: Vercel (Monolithic deployment)

### Features
✅ Google OAuth Authentication  
✅ Google Calendar Sync  
✅ Family Profiles (Kids)  
✅ Task Management with Star Rewards  
✅ Prize Redemption System  
✅ Meal Planning  
✅ Food Inventory Tracker  
✅ Shopping List  

---

## ⚙️ Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Google account
- A Vercel account (free tier works)
- Git installed

---

## 🔥 Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `family-calendar-app` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your nearest location
5. Click **"Enable"**

### Step 3: Update Firestore Security Rules

1. In Firestore, go to the **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write profiles they own
    match /profiles/{profileId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/profiles/$(profileId)).data.parentUserId == request.auth.uid;
    }
    
    // Users can read/write tasks for their profiles
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    // Users can read/write their prizes
    match /prizes/{prizeId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/prizes/$(prizeId)).data.userId == request.auth.uid;
    }
    
    // Other collections
    match /mealPlans/{mealId} {
      allow read, write: if request.auth != null;
    }
    
    match /inventory/{itemId} {
      allow read, write: if request.auth != null;
    }
    
    match /shoppingList/{itemId} {
      allow read, write: if request.auth != null;
    }
    
    match /redemptions/{redemptionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Step 4: Enable Firebase Authentication

1. Click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Google"** sign-in provider
5. Click **"Save"**

### Step 5: Get Firebase Admin SDK Credentials

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Go to the **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** (downloads a JSON file)
6. **IMPORTANT**: Keep this file secure and never commit it to Git
7. Rename the file to `firebase-service-account.json`

### Step 6: Get Firebase Web Configuration

1. Still in Project Settings, go to the **"General"** tab
2. Scroll down to **"Your apps"**
3. Click the Web icon `</>`
4. Register your app with a nickname: `family-calendar-web`
5. **Copy the Firebase configuration object** - you'll need these values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

---

## 🌐 Google Cloud Console Setup

### Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (it's automatically created)
3. Go to **"APIs & Services"** → **"Library"**
4. Search and enable these APIs:
   - **Google Calendar API**
   - **Google+ API** (for user info)

### Step 2: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"Create"**
4. Fill in required fields:
   - **App name**: Family Calendar App
   - **Support email**: Your email
   - **Developer contact**: Your email
5. Click **"Save and Continue"**
6. On **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `.../auth/calendar.readonly`
     - `.../auth/calendar.events`
7. Click **"Save and Continue"**
8. On **Test users** page:
   - Click **"Add Users"**
   - Add your Google email(s) for testing
9. Click **"Save and Continue"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Name: `Family Calendar OAuth`
5. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:4200
   https://your-app-name.vercel.app
   ```
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:4200/login
   http://localhost:4200/auth/callback
   https://your-app-name.vercel.app/login
   https://your-app-name.vercel.app/auth/callback
   ```
7. Click **"Create"**
8. **Copy the Client ID and Client Secret** - you'll need these!

---

## 💻 Local Development Setup

### Step 1: Install Dependencies

```bash
# Install root dependencies
cd C:\Solutions\Calendar
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
# Copy the example file
copy .env.example .env
```

2. Edit `.env` and fill in your values:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Or use service account file path (for local development)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4200/login

# Session
SESSION_SECRET=your-random-secret-string-here

# Environment
NODE_ENV=development
PORT=3000
```

### Step 3: Configure Frontend Firebase

1. Open `frontend/src/environments/firebase.config.ts`
2. Replace with your Firebase web configuration:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

export const apiUrl = 'http://localhost:3000/api';
```

### Step 4: Start Development Servers

Open a terminal and run:

```bash
cd C:\Solutions\Calendar
npm start
```

This will:
- Kill any processes running on ports 3000 and 4200
- Start the backend API on http://localhost:3000 with nodemon (auto-restart on changes)
- Start the frontend app on http://localhost:4200

Alternatively, you can run without killing ports:
```bash
npm run dev
```

Or run servers separately:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Step 5: Access the Application

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

---

## 🚀 Vercel Deployment

### Step 1: Prepare for Deployment

1. Ensure all changes are committed to Git:
```bash
git add .
git commit -m "Initial commit"
```

2. Push to GitHub (or GitLab/Bitbucket):
```bash
git remote add origin https://github.com/YOUR_USERNAME/family-calendar.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist/frontend/browser`

### Step 3: Configure Environment Variables in Vercel

1. In your Vercel project, go to **"Settings"** → **"Environment Variables"**
2. Add ALL variables from your `.env` file:

```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret
GOOGLE_REDIRECT_URI = https://your-app.vercel.app/login
SESSION_SECRET = your-secret
NODE_ENV = production
```

**IMPORTANT**: For `FIREBASE_PRIVATE_KEY`, make sure to:
- Include the entire key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Preserve the `\n` characters (don't replace them with actual newlines)
- Wrap the entire value in quotes

### Step 4: Update Google OAuth Redirect URIs

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth 2.0 Client ID
4. Add your Vercel domain to:
   - **Authorized JavaScript origins**:
     ```
     https://your-app-name.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     https://your-app-name.vercel.app/login
     https://your-app-name.vercel.app/auth/callback
     ```
5. Click **"Save"**

### Step 5: Update Frontend Configuration

1. Update `frontend/src/environments/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Use relative path for production
export const apiUrl = window.location.origin + '/api';
```

2. Commit and push these changes:
```bash
git add .
git commit -m "Update for production"
git push
```

Vercel will automatically redeploy!

### Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Click "Continue with Google"
3. Authorize the application
4. Start using your Family Calendar App!

---

## 🔐 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | `family-calendar-12345` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `firebase-adminsdk-xxx@...` |
| `FIREBASE_PRIVATE_KEY` | Private key from service account JSON | `-----BEGIN PRIVATE KEY-----...` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URL | `https://your-app.vercel.app/login` |
| `SESSION_SECRET` | Random string for sessions | `any-random-secret-string` |
| `NODE_ENV` | Environment | `development` or `production` |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Firebase Admin SDK initialization failed"
- **Solution**: Check that your Firebase service account credentials are correct
- Verify `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
- Ensure the private key includes `\n` characters

#### 2. "Google OAuth redirect_uri_mismatch"
- **Solution**: Make sure your redirect URIs in Google Cloud Console exactly match your app URIs
- Check for trailing slashes and http vs https

#### 3. "API returns 404 on Vercel"
- **Solution**: Verify `vercel.json` configuration
- Check that API routes start with `/api/`
- Ensure `api/index.js` exports the Express app

#### 4. "Firestore permission denied"
- **Solution**: Check Firestore security rules
- Verify user is authenticated
- Ensure rules match the document structure

#### 5. "Calendar events not loading"
- **Solution**: Verify Google Calendar API is enabled
- Check that OAuth scopes include calendar permissions
- Ensure user has granted calendar access

#### 6. "Build fails on Vercel"
- **Solution**: Check that all dependencies are in package.json
- Verify Angular build command: `ng build`
- Check build logs for specific errors

### Debug Mode

Enable detailed logging:

```typescript
// In backend
console.log('Debug:', variable);

// In frontend
console.log('Debug:', variable);
```

### Getting Help

- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Check [Angular Documentation](https://angular.io/docs)
- Open an issue in your repository

---

## 📊 Database Structure

### Firestore Collections

```
users/
  {userId}/
    - email
    - name
    - picture
    - googleTokens
    - selectedCalendars
    - createdAt
    - updatedAt

profiles/
  {profileId}/
    - parentUserId
    - name
    - avatar
    - age
    - stars
    - createdAt
    - updatedAt

tasks/
  {taskId}/
    - profileId
    - title
    - description
    - stars
    - frequency
    - frequencyUnit
    - completed
    - lastCompletedAt
    - availableAt
    - createdAt
    - updatedAt

prizes/
  {prizeId}/
    - userId
    - title
    - description
    - starCost
    - icon
    - createdAt
    - updatedAt

redemptions/
  {redemptionId}/
    - profileId
    - prizeId
    - prizeTitle
    - starCost
    - redeemedAt

mealPlans/
  {mealId}/
    - userId
    - date
    - mealType
    - title
    - recipe
    - ingredients[]
    - createdAt
    - updatedAt

inventory/
  {itemId}/
    - userId
    - name
    - quantity
    - unit
    - category
    - expiryDate
    - createdAt
    - updatedAt

shoppingList/
  {itemId}/
    - userId
    - name
    - quantity
    - unit
    - purchased
    - createdAt
```

---

## 🎉 Success!

You've successfully set up and deployed your Family Calendar App! 🚀

### Next Steps

1. **Customize**: Modify colors, add features, adjust UI
2. **Test**: Add test users and verify all features work
3. **Scale**: Monitor usage and upgrade Firebase plan if needed
4. **Secure**: Review and tighten Firestore security rules
5. **Publish**: Remove test mode from OAuth consent screen when ready

### Features to Explore

- Google Calendar sync
- Create family member profiles
- Assign tasks and earn stars
- Create and redeem prizes
- Plan weekly meals
- Track food inventory
- Manage shopping lists

Enjoy your new Family Calendar App! 🎊
