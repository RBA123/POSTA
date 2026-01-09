# Firebase Configuration for Liberta

This directory contains all Firebase-related configuration and code for the Liberta betting platform.

## Structure

```
firebase/
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Composite indexes for queries
├── functions/                # Cloud Functions
│   ├── src/
│   │   ├── bets/            # Bet-related functions
│   │   ├── markets/         # Market-related functions
│   │   ├── notifications/  # Notification functions
│   │   └── index.ts        # Main entry point
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   └── seedData.ts         # Seed script for test data
├── types/
│   └── firestore.types.ts  # TypeScript interfaces
└── README.md
```

## Setup

### 1. Install Cloud Functions Dependencies

```bash
cd firebase/functions
npm install
```

### 2. Deploy Firestore Rules and Indexes

```bash
# From project root
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 3. Build and Deploy Cloud Functions

```bash
cd firebase/functions
npm run build
npm run deploy
```

### 4. Seed Test Data

```bash
# Set up Firebase Admin credentials
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"

# Run seed script
npx ts-node firebase/scripts/seedData.ts
```

## Firestore Collections

### Root Collections

- **`users`** - User profiles and account data
- **`markets`** - Betting markets/questions
- **`userBets`** - User-centric bet records (for Activity screen)
- **`transactions`** - Financial transaction history

### Subcollections

- **`users/{userId}/notifications`** - User notifications
- **`users/{userId}/paymentMethods`** - Saved payment methods
- **`users/{userId}/settings`** - User preferences
- **`markets/{marketId}/bets`** - Market-level bet aggregation

## Cloud Functions

### Bet Functions

- **`placeBet`** (Callable) - Place a bet on a market
- **`settleMarket`** (Callable) - Settle a market and resolve all bets

### Market Functions

- **`updateMarketOdds`** (Trigger) - Auto-update odds when bets are placed
- **`recalculateMarketOdds`** (Callable) - Manually recalculate odds
- **`scheduledMarketStatus`** (Scheduled) - Update market statuses every minute
- **`createMarket`** (Callable) - Create a new market (admin only)

### Notification Functions

- **`sendMarketOpenNotification`** (Trigger) - Send notifications when markets open
- **`sendCustomNotification`** (Callable) - Send custom notification
- **`markNotificationRead`** (Callable) - Mark notification as read

## Security Rules

Security rules are defined in `firestore.rules`. Key points:

- Users can only read/update their own data
- Markets are publicly readable, admin-writable
- Bets can only be created via Cloud Functions
- Transactions are read-only for users, write-only via Functions

## Indexes

Composite indexes are defined in `firestore.indexes.json`. These optimize:

- Markets by category + status + openAt
- User bets by userId + status + placedAt
- Transactions by userId + createdAt

## TypeScript Types

All Firestore document types are defined in `types/firestore.types.ts`. Import these in your app:

```typescript
import { User, Market, UserBet, Transaction } from '../firebase/types/firestore.types';
```

## Development Workflow

1. **Local Development**: Use Firebase Emulator Suite
   ```bash
   firebase emulators:start
   ```

2. **Testing Functions**: Use Firebase Functions shell
   ```bash
   npm run shell
   ```

3. **Deploy**: Deploy incrementally
   ```bash
   firebase deploy --only functions:placeBet
   ```

## Environment Variables

Cloud Functions may need environment variables. Set them via:

```bash
firebase functions:config:set some.key="value"
```

Access in functions:
```typescript
const config = functions.config();
const value = config.some.key;
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

View specific function logs:
```bash
firebase functions:log --only placeBet
```

## Troubleshooting

### Functions won't deploy
- Check Node.js version matches `package.json` engines
- Ensure all dependencies are installed
- Verify Firebase CLI is logged in: `firebase login`

### Security rules not applying
- Rules deploy separately: `firebase deploy --only firestore:rules`
- Check Firebase Console for rule syntax errors

### Index errors
- Indexes are created automatically when queries run
- Check Firebase Console > Firestore > Indexes for pending indexes
- Deploy indexes manually: `firebase deploy --only firestore:indexes`

