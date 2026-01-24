# Liberta Admin Dashboard

Web-based admin dashboard for managing Liberta betting markets.

## Features

- **Market Management**: Create, view, and manage betting markets
- **Market Settlement**: Settle markets and resolve all bets
- **Real-time Updates**: Live updates for market odds and statistics
- **Dashboard**: Overview of market statistics and quick actions

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Authentication

The admin dashboard requires:
- Firebase Authentication account
- `isAdmin: true` flag in user document in Firestore

## Deployment

The admin tool can be deployed to:
- Firebase Hosting
- Vercel
- Netlify
- Any static hosting service

Build the project and deploy the `dist/` folder.
