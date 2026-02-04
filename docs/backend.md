# Liberta - Backend Architecture

## Overview

Liberta uses Firebase as its complete backend infrastructure, providing authentication, database, serverless functions, and real-time capabilities. All backend logic is implemented using Firebase services.

## Firebase Services

### Firebase Authentication

- **Provider**: Email/Password
- **User Management**: Automatic user creation and session management
- **Security**: Firebase handles password hashing and secure token generation
- **Integration**: Used via Firebase Auth SDK in the mobile app

### Cloud Firestore

- **Type**: NoSQL document database
- **Region**: us-central1
- **Database**: (default)
- **Features**: Real-time listeners, offline persistence, automatic scaling

### Cloud Functions

- **Runtime**: Node.js 20
- **Region**: us-central1
- **Type**: 1st Generation Functions
- **Triggers**: HTTPS Callable, Firestore Triggers, Scheduled (Pub/Sub)

## Firestore Data Model

**IMPORTANT: All monetary values are stored as INTEGER CENTS to avoid floating-point precision errors.**

- Example: $100.00 = 10000 cents
- Example: $1.50 = 150 cents
- Minimum bet: 100 cents ($1.00)
- Initial user balance: 10000 cents ($100.00)

### Root Collections

#### 1. `users` Collection

Stores user profiles and account information.

**Document Structure:**

```typescript
{
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;
  phoneNumber: string | null;
  phoneCode: string | null;
  firstName: string;
  lastName: string;
  username: string;               // Unique, lowercase
  dateOfBirth: Timestamp;
  countryCode: string;           // ISO 2-letter (e.g., "AR")
  friendCode: string;            // Unique referral code (e.g., "DIEGO323")
  virtualBalance: number;        // Current balance in CENTS (e.g., 10000 = $100.00)
  totalPositions: number;        // All-time bets count
  activePositions: number;       // Current pending bets
  winRate: number;               // Percentage (0-100)
  totalWinnings: number;         // Total winnings in CENTS
  totalLosses: number;           // Total losses in CENTS
  notificationsEnabled: boolean;
  notificationPreferences: {
    liveMarkets: boolean;
    marketResults: boolean;
    promotions: boolean;
  };
  termsAccepted: boolean;
  termsAcceptedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  referredBy: string | null;     // UID of referrer
  isAdmin: boolean;              // Admin role flag
}
```

**Subcollections:**

- `users/{userId}/notifications` - User notifications
- `users/{userId}/paymentMethods` - Saved payment methods
- `users/{userId}/settings` - User preferences

#### 2. `markets` Collection

Stores betting markets/questions.

**Document Structure:**

```typescript
{
  id: string;                    // Auto-generated (document ID)
  question: string;
  description?: string;
  category: MarketCategory;      // "en_vivo" | "partidos" | "torneos" | "fase_grupos" | "jugadores"
  siProbability: number;         // 0-100
  noProbability: number;         // 0-100
  totalVolume: number;           // Total amount bet in CENTS
  totalBets: number;             // Number of bets placed
  uniqueBettors: number;         // Count of unique users
  siVolume: number;              // Volume on "Sí" side in CENTS
  noVolume: number;              // Volume on "No" side in CENTS
  status: MarketStatus;          // "draft" | "open" | "locked" | "settled" | "cancelled"
  isUrgent: boolean;             // For EN VIVO markets
  openAt: Timestamp;             // When market opens
  lockAt?: Timestamp;            // When betting closes (for EN VIVO)
  settledAt?: Timestamp;
  result?: MarketResult;         // "si" | "no" | "cancelled"
  resultVerifiedBy?: string;     // Admin UID who settled
  createdBy: string;             // Admin UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];               // For filtering
  imageUrl?: string;             // Optional market image
}
```

**Subcollections:**

- `markets/{marketId}/bets` - Market-level bet aggregation (for leaderboards)

#### 3. `userBets` Collection

User-centric bet records (for Activity screen).

**Document Structure:**

```typescript
{
  id: string;                    // Auto-generated (document ID)
  userId: string;                // For querying
  marketId: string;              // Reference to market
  marketQuestion: string;        // Denormalized for display
  marketCategory: string;        // Denormalized for display
  side: "si" | "no";
  amount: number;                // Bet amount in CENTS
  probability: number;           // Snapshot at bet time
  potentialWin: number;          // Calculated payout in CENTS
  status: BetStatus;             // "pending" | "won" | "lost" | "refunded"
  actualWin?: number;            // Filled when settled in CENTS
  settledAt?: Timestamp;
  placedAt: Timestamp;
  createdAt: Timestamp;
}
```

#### 4. `transactions` Collection

Financial transaction history.

**Document Structure:**

```typescript
{
  id: string;                    // Auto-generated (document ID)
  userId: string;
  type: TransactionType;         // "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "bet_refund" | "referral_bonus"
  amount: number;                // Positive or negative in CENTS
  balanceBefore: number;         // Balance before transaction in CENTS
  balanceAfter: number;          // Balance after transaction in CENTS
  description: string;
  betId?: string;                 // Reference if bet-related
  marketId?: string;
  paymentMethodId?: string;
  providerId?: string;
  providerStatus?: string;
  status: TransactionStatus;      // "pending" | "completed" | "failed" | "cancelled"
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

### Subcollections

#### `users/{userId}/notifications`

User notifications.

**Document Structure:**

```typescript
{
  id: string;                    // Auto-generated (document ID)
  type: "market_live" | "bet_result" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  marketId?: string;             // Reference to market
  betId?: string;                // Reference to bet
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

#### `users/{userId}/paymentMethods`

Saved payment methods (future feature).

**Document Structure:**

```typescript
{
  id: string;
  type: "card" | "apple_pay" | "google_pay" | "mercadopago";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  providerId?: string;
  isDefault: boolean;
  isConnected: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `users/{userId}/settings`

User preferences.

**Document Structure:**

```typescript
{
  id: "preferences"; // Fixed document ID
  theme: "light" | "dark" | "auto";
  language: "es" | "en" | "pt";
  currency: string;
  updatedAt: Timestamp;
}
```

#### `markets/{marketId}/bets`

Market-level bet aggregation (for leaderboards).

**Document Structure:**

```typescript
{
  id: string; // Bet ID
  userId: string;
  username: string; // Denormalized for leaderboards
  side: "si" | "no";
  amount: number;
  probability: number; // Snapshot at bet time
  potentialWin: number;
  placedAt: Timestamp;
}
```

## Security Rules

Firestore security rules are defined in `firebase/firestore.rules`.

### Key Rules

1. **Users Collection**
   - Users can read/update their own profile
   - Users can create their own profile during signup (with validation)
   - Users cannot modify: `uid`, `isAdmin`, balance/stats fields, `createdAt`, `referredBy`
   - Admins can read/update any user

2. **Markets Collection**
   - Public read access (anyone can read markets)
   - Only admins can create/update/delete markets

3. **User Bets Collection**
   - Users can read their own bets
   - Only Cloud Functions can create/update bets (prevents cheating)

4. **Transactions Collection**
   - Users can read their own transactions
   - Only Cloud Functions can create/update transactions

5. **Notifications Subcollection**
   - Users can read/update their own notifications
   - Only Cloud Functions can create notifications

6. **Market Bets Subcollection**
   - Public read access (for leaderboards)
   - Only Cloud Functions can create/update bets

### Helper Functions

- `isAuthenticated()` - Checks if user is authenticated
- `isAdmin()` - Checks if user has admin flag
- `isOwner(userId)` - Checks if user owns the resource
- `isValidUserData()` - Validates user data structure

## Cloud Functions

All Cloud Functions are located in `firebase/functions/src/`.

### Function Structure

```
firebase/functions/
├── src/
│   ├── index.ts                    # Main entry point, exports all functions
│   ├── bets/
│   │   ├── placeBet.ts            # Place a bet
│   │   └── settleBets.ts          # Settle a market
│   ├── markets/
│   │   ├── updateOdds.ts          # Update market odds
│   │   └── marketScheduler.ts     # Market scheduling
│   └── notifications/
│       └── sendPushNotification.ts # Notification functions
├── package.json
└── tsconfig.json
```

### Bet Functions

#### `placeBet` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Place a bet on a market

**Process:**

1. Validates authentication
2. Validates input (marketId, side, amount)
3. Checks user has sufficient balance
4. Verifies market is open and not locked
5. Calculates potential win based on current odds
6. Creates bet documents atomically:
   - `userBets` document (user-centric)
   - `markets/{marketId}/bets` document (market-centric)
7. Updates user balance and stats
8. Updates market volume and stats
9. Creates transaction record
10. Returns bet ID and new balance

**Error Cases:**

- Unauthenticated user
- Invalid input
- Insufficient balance
- Market not found or not open
- Market locked (past lockAt time)

#### `settleMarket` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Settle a market and resolve all bets (admin only)

**Process:**

1. Validates admin authentication
2. Validates market exists
3. Sets market status to "settled"
4. Sets market result ("si" | "no" | "cancelled")
5. Finds all pending bets for the market
6. For each bet:
   - If won: Updates bet status to "won", adds winnings to user balance
   - If lost: Updates bet status to "lost"
   - If cancelled: Updates bet status to "refunded", refunds bet amount
7. Creates transaction records for all balance changes
8. Updates user stats (winRate, totalWinnings, totalLosses)
9. Updates market document with settlement info

**Error Cases:**

- Non-admin user
- Market not found
- Market already settled
- Invalid result value

### Market Functions

#### `updateMarketOdds` (Firestore Trigger)

**Trigger**: Firestore Document Create (`markets/{marketId}/bets/{betId}`)  
**Purpose**: Automatically update market odds when bets are placed

**Process:**

1. Triggers when a bet is added to `markets/{marketId}/bets`
2. Gets current market data
3. Skips if market is not open
4. Calculates new probabilities:
   - `siProbability = (siVolume / totalVolume) * 100`
   - `noProbability = 100 - siProbability`
5. Updates market document with new odds
6. Ensures probabilities sum to 100

**Note**: This is a background function, errors are logged but don't throw.

#### `recalculateMarketOdds` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Manually recalculate odds for a specific market

**Process:**

1. Validates authentication
2. Gets market document
3. Aggregates all bets in `markets/{marketId}/bets` subcollection
4. Calculates total volume for each side
5. Recalculates probabilities
6. Updates market document with new odds and volumes

**Use Case**: Can be called if odds get out of sync or for manual correction.

#### `scheduledMarketStatus` (Scheduled)

**Trigger**: Pub/Sub Schedule (every 1 minute)  
**Purpose**: Automatically lock EN VIVO markets that have passed their lockAt time

**Process:**

1. Runs every minute
2. Finds all open markets with `isUrgent == true`
3. Checks if `lockAt` timestamp has passed
4. Updates market status to "locked" for expired markets
5. Commits batch updates

**Note**: This ensures EN VIVO markets automatically close at their scheduled time.

#### `createMarket` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Create a new market (admin only)

**Process:**

1. Validates admin authentication
2. Validates input (question, category required)
3. Determines initial status:
   - If `openAt` is in the past or now: status = "open"
   - Otherwise: status = "draft"
4. Creates market document with:
   - Initial odds: 50/50
   - Zero volume and stats
   - Timestamps (openAt, lockAt if provided)
   - Admin metadata
5. Returns market ID and status

**Error Cases:**

- Non-admin user
- Missing required fields
- Invalid category

### Notification Functions

#### `sendMarketOpenNotification` (Firestore Trigger)

**Trigger**: Firestore Document Update (`markets/{marketId}`)  
**Purpose**: Send notifications when a market opens

**Process:**

1. Triggers when market status changes to "open"
2. Finds all users with `notificationsEnabled == true`
3. Checks user notification preferences (`liveMarkets` flag)
4. Creates in-app notification for each user
5. Stores notification in `users/{userId}/notifications` subcollection
6. (Future) Sends push notification via FCM

**Note**: This is a background function, errors are logged but don't throw.

#### `sendCustomNotification` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Send a custom notification to a user

**Process:**

1. Validates authentication
2. Validates input (userId, type, title, message)
3. Checks permissions:
   - Users can send to themselves
   - Admins can send to any user
4. Verifies target user exists
5. Creates notification document
6. Returns notification ID

**Use Cases**: Promotions, system messages, bet result notifications

#### `markNotificationRead` (Callable)

**Trigger**: HTTPS Callable  
**Purpose**: Mark a notification as read

**Process:**

1. Validates authentication
2. Finds notification in user's subcollection
3. Updates notification with `read: true` and `readAt` timestamp
4. Returns success

## Indexes

Firestore composite indexes are defined in `firebase/firestore.indexes.json`.

### Key Indexes

1. **Markets**
   - `category + status + openAt` - For querying markets by category and status
   - `status + isUrgent + lockAt` - For scheduled market locking
   - `category + isUrgent + openAt` - For EN VIVO market queries

2. **User Bets**
   - `userId + status + placedAt` - For Activity screen filtering
   - `userId + placedAt` - For Activity screen chronological order
   - `marketId + status + placedAt` - For market settlement queries

3. **Transactions**
   - `userId + createdAt` - For transaction history
   - `userId + type + createdAt` - For filtered transaction queries

4. **Notifications**
   - `read + createdAt` (collection group) - For unread notifications query

## Real-Time Subscriptions

The frontend uses Firestore `onSnapshot` listeners for real-time updates:

### Market Updates

- Listeners on `markets` collection queries
- Update when odds change (via `updateMarketOdds` trigger)
- Update when market status changes

### Bet Updates

- Listeners on `userBets` collection queries
- Update when bet status changes (via `settleMarket`)
- Update immediately after bet placement

### Balance Updates

- User profile listeners
- Update immediately after bet placement
- Update when bets are settled

### Notification Updates

- Listeners on `users/{userId}/notifications` subcollection
- Update when new notifications are created
- Update when notifications are marked as read

## Transaction Handling

All balance updates happen atomically using Firestore batches:

1. **Bet Placement** (`placeBet`)
   - Creates bet documents
   - Updates user balance
   - Updates market volume
   - Creates transaction record
   - All in a single batch commit

2. **Market Settlement** (`settleMarket`)
   - Updates all bet statuses
   - Updates all user balances
   - Creates transaction records
   - Updates user stats
   - Uses batch writes for atomicity

## Authentication Flow

1. **Signup**
   - User signs up via Firebase Auth (email/password)
   - Cloud Function or client creates Firestore user profile
   - Initial balance set to 100.0 virtual currency
   - Profile includes all required fields

2. **Login**
   - User signs in via Firebase Auth
   - App checks if Firestore profile exists
   - If profile exists, user is authenticated
   - If no profile, user must complete signup

3. **Session Management**
   - Firebase Auth handles token refresh
   - Tokens stored securely by Firebase SDK
   - Auth state persists across app restarts

## Deployment

### Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Cloud Functions

```bash
cd firebase/functions
npm run build
firebase deploy --only functions
```

### Deploy Everything

```bash
firebase deploy
```

## Monitoring & Logging

### Function Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only placeBet
```

### Firestore Usage

- Monitor in Firebase Console > Firestore > Usage
- Track read/write operations
- Monitor index usage

### Function Performance

- View execution times in Firebase Console
- Monitor error rates
- Track invocation counts

## Error Handling

### Function Errors

- Use `functions.https.HttpsError` for callable functions
- Error codes: `unauthenticated`, `permission-denied`, `invalid-argument`, `not-found`, `failed-precondition`, `internal`
- Background functions log errors but don't throw (to prevent retries)

### Validation

- Input validation in all callable functions
- Type checking for all parameters
- Business rule validation (balance checks, market status, etc.)

## Performance Considerations

1. **Batch Writes**: Use Firestore batches for atomic operations
2. **Denormalization**: Store frequently accessed data (marketQuestion, username) in bet documents
3. **Indexes**: Composite indexes for complex queries
4. **Real-time Efficiency**: Single subscription per hook, cleaned up on unmount
5. **Function Optimization**: Minimize Firestore reads/writes, use batch operations

## Security Best Practices

1. **Client-Side Validation**: Never trust client input, validate in Cloud Functions
2. **Admin Checks**: Always verify `isAdmin` flag in user document
3. **Balance Protection**: Only Cloud Functions can modify balances
4. **Bet Creation**: Only Cloud Functions can create bets (prevents cheating)
5. **Security Rules**: Comprehensive rules prevent unauthorized access
6. **Authentication**: All sensitive operations require authentication

## Future Enhancements

- Push notifications via FCM (Firebase Cloud Messaging)
- Payment integration (MercadoPago, Stripe)
- Withdrawal functionality
- Referral bonus system
- Advanced analytics and reporting
- Admin dashboard for market management
- Automated market creation from external data sources
- Market result verification system
