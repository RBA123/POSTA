# Posta — Real-time Sports Prediction Markets

Working product of **GanaYA**, a prediction-markets fintech venture I co-founded in Ecuador (Feb–Jul 2026). Posta is a mobile app where users place virtual bets on sports markets with live, dynamically updating odds — built sports-first as our go-to-market wedge for Latin America.

> GanaYA suspended operations in July 2026 after new licensing requirements broke unit economics — a deliberate product decision. The app below is the working product we shipped.

## What it does

- Real-time sports betting markets with dynamic, live-updating odds
- Virtual balance system (no real money — pure prediction-market mechanics)
- User profiles, statistics, and activity tracking
- Push notifications for market movements
- Admin panel for creating and managing markets
- Multiple market categories (EN VIVO, Partidos, Torneos, and more)

## Technology stack

- **Frontend**: React Native (Expo), TypeScript, React Navigation, TanStack Query, NativeWind
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Cloud Functions**: Node.js 20, TypeScript (us-central1)

## Documentation

Detailed docs live in the `docs/` folder:

- **[App Overview](docs/app.md)** — features and user flow
- **[Frontend Architecture](docs/frontend.md)** — components and patterns
- **[Backend Architecture](docs/backend.md)** — Firebase implementation, Cloud Functions, data model
- **[Admin Tool Plan](docs/admin.md)** — admin dashboard for managing markets

## Project structure

```
Liberta/
├── App.tsx              # Main app entry point
├── components/          # Reusable UI components
├── screens/             # Navigation screens
├── hooks/               # Custom React hooks
├── services/            # Service layer (Firebase abstractions)
├── contexts/            # React Context providers
├── lib/                 # Utility libraries
├── types/               # TypeScript type definitions
├── constants/           # App constants
├── firebase/            # Firebase configuration and Cloud Functions
└── docs/                # Documentation
```

## Quick start

```bash
npm install
npm start            # development server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # web browser
