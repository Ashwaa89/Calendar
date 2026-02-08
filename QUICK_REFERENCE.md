# Quick Reference Guide

## 🚀 Common Commands

### Development
```bash
# Install all dependencies
npm install
cd frontend && npm install && cd ..

# Start development (kills ports, starts both servers with auto-restart)
npm start

# Or run without killing ports first
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only  
npm run dev:frontend

# Kill ports 3000 and 4200
npm run kill-ports

# Build for production
npm run build
```

## 📋 Pre-Launch Checklist

### Before First Run
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Created Firebase project
- [ ] Enabled Firestore Database
- [ ] Created Firebase service account
- [ ] Enabled Google Calendar API
- [ ] Created OAuth 2.0 credentials
- [ ] Configured OAuth consent screen
- [ ] Added test users to OAuth
- [ ] Copied `.env.example` to `.env`
- [ ] Filled in all `.env` values
- [ ] Updated `frontend/src/environments/firebase.config.ts`
- [ ] Run `npm install` in root
- [ ] Run `npm install` in frontend folder

### Before Deployment
- [ ] Tested locally
- [ ] All features working
- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Created Vercel account
- [ ] Imported project to Vercel
- [ ] Added all environment variables in Vercel
- [ ] Updated OAuth redirect URIs with Vercel URL
- [ ] Updated `firebase.config.ts` for production
- [ ] Tested deployed version

## 🔍 Quick Troubleshooting

### Issue: "Cannot connect to backend"
**Check:**
- Backend server is running on port 3000
- CORS is enabled in backend
- API URL is correct in `firebase.config.ts`

### Issue: "Firebase initialization failed"
**Check:**
- `.env` file exists in root
- All Firebase variables are set
- Private key format is correct (with `\n`)
- Service account file exists (if using file path)

### Issue: "OAuth redirect_uri_mismatch"
**Check:**
- Redirect URIs in Google Cloud Console
- `GOOGLE_REDIRECT_URI` in `.env`
- URIs match exactly (including http/https)
- No trailing slashes

### Issue: "Firestore permission denied"
**Check:**
- Security rules are published
- User is authenticated
- User ID matches in rules
- Document structure matches rules

### Issue: "Calendar events not loading"
**Check:**
- Google Calendar API is enabled
- OAuth scopes include calendar permissions
- User granted calendar access during login
- Valid access token exists

## 📱 Access URLs

### Local Development
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **API Health Check**: http://localhost:3000/api/health

### Production (Vercel)
- **App**: https://your-app-name.vercel.app
- **API**: https://your-app-name.vercel.app/api
- **Health**: https://your-app-name.vercel.app/api/health

## 🗂️ Key Files

### Configuration
- `.env` - Backend environment variables
- `frontend/src/environments/firebase.config.ts` - Frontend Firebase config
- `vercel.json` - Vercel deployment config
- `angular.json` - Angular build configuration

### Backend
- `api/server.js` - Main Express server
- `api/firebase-config.js` - Firebase initialization
- `api/google-auth.js` - Google OAuth logic
- `api/auth.js` - Authentication routes

### Frontend
- `frontend/src/app/app.component.ts` - Root component
- `frontend/src/app/app.routes.ts` - Routing configuration
- `frontend/src/app/services/` - API services
- `frontend/src/app/components/` - UI components

## 🔐 Security Notes

### Never Commit
- `.env` file
- `firebase-service-account.json`
- Any file with API keys or secrets
- `node_modules/`

### Always .gitignore
- `.env`
- `.env.local`
- `.env.production`
- `firebase-service-account.json`
- `serviceAccountKey.json`
- `dist/`
- `node_modules/`

## 📊 API Endpoints

### Authentication
- `GET /api/auth/google-auth-url` - Get OAuth URL
- `POST /api/auth/google-callback` - Handle OAuth callback
- `POST /api/auth/verify-token` - Verify Firebase token
- `POST /api/auth/logout` - Logout user

### Calendar
- `GET /api/calendar/google-calendars/:userId` - Get user's calendars
- `POST /api/calendar/events/:userId` - Get calendar events
- `POST /api/calendar/save-selected/:userId` - Save selected calendars

### Profiles
- `GET /api/profiles/:userId` - Get all profiles
- `POST /api/profiles/:userId` - Create profile
- `PUT /api/profiles/:profileId` - Update profile
- `DELETE /api/profiles/:profileId` - Delete profile

### Tasks
- `GET /api/tasks/:profileId` - Get profile tasks
- `POST /api/tasks` - Create task
- `POST /api/tasks/complete/:taskId` - Complete task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task

### Prizes
- `GET /api/prizes/:userId` - Get prizes
- `POST /api/prizes` - Create prize
- `POST /api/prizes/redeem` - Redeem prize
- `DELETE /api/prizes/:prizeId` - Delete prize

### Meals
- `GET /api/meals/:userId` - Get meal plans
- `POST /api/meals` - Add meal
- `PUT /api/meals/:mealId` - Update meal
- `DELETE /api/meals/:mealId` - Delete meal

### Inventory
- `GET /api/inventory/:userId` - Get inventory
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:itemId` - Update item
- `DELETE /api/inventory/:itemId` - Delete item
- `GET /api/inventory/shopping/:userId` - Get shopping list
- `POST /api/inventory/shopping` - Add to shopping list

## 💡 Tips & Best Practices

### Development
1. Always have both backend and frontend running
2. Check browser console for errors
3. Check terminal for backend errors
4. Use Chrome DevTools for debugging
5. Clear browser cache if having issues

### Deployment
1. Test locally before deploying
2. Check Vercel build logs for errors
3. Verify all environment variables
4. Test all features after deployment
5. Monitor Vercel analytics

### Security
1. Never expose API keys
2. Use environment variables
3. Keep dependencies updated
4. Review Firestore security rules
5. Limit OAuth scopes to needed ones

### Performance
1. Enable Firestore indexes for common queries
2. Cache API responses where appropriate
3. Optimize images and assets
4. Use lazy loading for components
5. Monitor Vercel analytics

## 📞 Getting Help

1. **Check Documentation**
   - README.md - Overview
   - SETUP_GUIDE.md - Detailed setup
   - This file - Quick reference

2. **Check Logs**
   - Backend: Terminal running `npm run dev:backend`
   - Frontend: Browser console (F12)
   - Vercel: Deployment logs in dashboard

3. **Common Resources**
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Angular Docs](https://angular.io/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [Google Calendar API](https://developers.google.com/calendar)

4. **Create an Issue**
   - Search existing issues first
   - Provide error messages
   - Include steps to reproduce
   - Mention your environment (OS, Node version, etc.)

## 🎯 Success Criteria

Your app is working correctly when:
- ✅ You can log in with Google
- ✅ You stay logged in after page refresh
- ✅ You can see your Google calendars
- ✅ You can create family profiles
- ✅ You can add and complete tasks
- ✅ Stars are awarded correctly
- ✅ You can create and redeem prizes
- ✅ You can plan meals
- ✅ You can track inventory
- ✅ All animations work smoothly

---

Happy coding! 🚀
