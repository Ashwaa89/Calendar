# 🏠 Family Calendar App

A comprehensive family management application with Google Calendar integration, task management, rewards system, meal planning, and inventory tracking.

![Family Calendar App](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🔐 Authentication
- Google OAuth 2.0 login
- Persistent sessions
- Secure Firebase Authentication

### 📅 Calendar Integration
- Sync with multiple Google Calendars
- View events in a beautiful calendar interface
- Select which calendars to share

### 👨‍👩‍👧‍👦 Family Profiles
- Create kid profiles (no email needed)
- Custom avatars and names
- Track stars earned by each child

### ✅ Task Management
- Create tasks with star rewards
- Set recurring tasks (hourly, daily, weekly)
- Tasks automatically become available again after completion

### 🏆 Rewards System
- Create custom prizes
- Set star costs for each prize
- Kids can redeem stars for prizes
- Track redemption history

### 🍽️ Meal Planning
- Plan meals for the week
- Organize by breakfast, lunch, dinner, and snacks
- Add recipes and cooking notes

### 🛒 Food Inventory & Shopping
- Track food items in your pantry
- Set expiry dates with alerts
- Manage shopping list
- Organize by categories

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Google account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ashwaa89/Calendar.git
   cd Calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

3. **Configure environment**
   ```bash
   copy .env.example .env
   # Edit .env with your configurations
   ```

4. **Start development servers**
   ```bash
   # Kills any previous instances and starts both servers with auto-restart
   npm start
   ```

5. **Access the app**
   - Frontend: http://localhost:4200
   - Backend: http://localhost:3000

### Available Scripts
- `npm start` - Kill ports 3000/4200 and start both servers with nodemon
- `npm run dev` - Start both servers (without killing ports)
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only
- `npm run kill-ports` - Kill processes on ports 3000 and 4200
- `npm run build` - Build frontend for production

## 📖 Documentation

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

The guide includes:
- Firebase configuration
- Google Cloud Console setup
- OAuth credentials
- Firestore security rules
- Vercel deployment
- Troubleshooting tips

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 17 (Standalone Components)
- **Styling**: SCSS with custom animations
- **State Management**: RxJS
- **Authentication**: Firebase Auth
- **HTTP Client**: Angular HttpClient

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: Firebase Admin SDK
- **APIs**: Google Calendar API, Google OAuth 2.0
- **Database**: Cloud Firestore

### Deployment
- **Platform**: Vercel
- **Architecture**: Monolithic (Frontend + Backend)
- **Serverless Functions**: Vercel Functions

## 📁 Project Structure

```
Calendar/
├── api/                          # Backend API
│   ├── auth.js                   # Authentication routes
│   ├── calendar.js               # Calendar integration
│   ├── firebase-config.js        # Firebase setup
│   ├── google-auth.js            # Google OAuth
│   ├── inventory.js              # Inventory management
│   ├── meals.js                  # Meal planning
│   ├── prizes.js                 # Rewards system
│   ├── profiles.js               # Family profiles
│   ├── tasks.js                  # Task management
│   └── server.js                 # Express server
├── frontend/                     # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/       # UI components
│   │   │   ├── guards/           # Route guards
│   │   │   ├── services/         # API services
│   │   │   ├── app.component.*   # Root component
│   │   │   └── app.routes.ts     # Route configuration
│   │   ├── environments/         # Configuration
│   │   ├── styles.scss           # Global styles
│   │   └── main.ts               # Bootstrap
│   ├── angular.json              # Angular config
│   └── package.json              # Frontend dependencies
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root dependencies
├── vercel.json                   # Vercel configuration
├── SETUP_GUIDE.md                # Detailed setup guide
└── README.md                     # This file
```

## 🎨 Features in Detail

### Calendar View
- Beautiful monthly calendar grid
- Click to view daily events
- Navigate between months
- Color-coded events by calendar

### Profile Management
- Create multiple child profiles
- Fun emoji avatars
- Age tracking
- Star balance display

### Task System
- Assign tasks to specific profiles
- Set star rewards (1-99 ⭐)
- Recurring tasks with custom frequencies
- Automatic availability tracking
- Task completion animations

### Prize Shop
- Create custom prizes
- Set star costs
- Icon selection
- Redemption flow
- Not enough stars prevention

### Meal Planner
- Week view grid
- 4 meal types per day
- Quick meal addition
- Recipe notes
- Shopping list integration

### Food Inventory
- Categorized items (Dairy, Meat, Vegetables, etc.)
- Quantity tracking with units
- Expiry date alerts
- Low stock warnings
- Shopping list generation

## 🔒 Security

- Firebase Authentication for user verification
- Firestore security rules for data protection
- OAuth 2.0 for Google integration
- No sensitive data in frontend
- Environment variables for secrets

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px+)
- Tablet (768px+)
- Mobile (320px+)

## 🚧 Roadmap

Future features planned:
- [ ] Push notifications for task reminders
- [ ] Recipe suggestions based on inventory
- [ ] Shopping list sharing
- [ ] Budget tracking
- [ ] Chore rotation scheduling
- [ ] Achievement badges
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Ashwaa89**
- GitHub: [@Ashwaa89](https://github.com/Ashwaa89)

## 🙏 Acknowledgments

- Angular team for the amazing framework
- Firebase for backend services
- Google for Calendar API
- Vercel for hosting
- All open-source contributors

## 📞 Support

If you have any questions or need help, please:
1. Check the [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Search existing issues
3. Create a new issue

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

Made with ❤️ for families everywhere
