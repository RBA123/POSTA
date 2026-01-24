# Liberta

A real-time sports betting mobile application built with React Native, Expo, and Firebase. Liberta enables users to place virtual bets on sports markets with dynamic odds that update in real-time.

## Quick Start

### Installation

Install dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm start
```

Run on specific platforms:

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Technology Stack

- **Frontend**: React Native (Expo), TypeScript, React Navigation, TanStack Query, NativeWind
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Cloud Functions**: Node.js 20, TypeScript
- **Region**: us-central1

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[App Overview](docs/app.md)** - General information about the app, features, and user flow
- **[Frontend Architecture](docs/frontend.md)** - Detailed frontend architecture, components, and patterns
- **[Backend Architecture](docs/backend.md)** - Firebase backend implementation, Cloud Functions, and data model
- **[Admin Tool Plan](docs/admin.md)** - Plan for admin dashboard to manage markets

## Project Structure

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

## Key Features

- Real-time betting markets with dynamic odds
- Virtual balance system
- Live market updates
- User profiles and statistics
- Activity tracking
- Push notifications
- Multiple market categories (EN VIVO, Partidos, Torneos, etc.)

## Firebase Setup

The app uses Firebase for authentication, database, and serverless functions. See [Backend Architecture](docs/backend.md) for detailed setup instructions.

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI
- Firebase CLI (for backend deployment)

### Environment Setup

1. Install dependencies: `npm install`
2. Configure Firebase (see `docs/backend.md`)
3. Start development server: `npm start`

## License

[Add your license here]
