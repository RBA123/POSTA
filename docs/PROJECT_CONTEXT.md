# PROJECT_CONTEXT.md — Posta Betting App

> **Purpose:** This file onboards AI agents for future development. It contains precise, code-grounded context. Treat every file path, function name, and type definition as authoritative.

---

## 1. Project Overview

**Posta** is a mobile sports betting application targeting Latin American users (primary market: Argentina). Users bet virtual currency on sports market outcomes ("Sí" / "No" binary questions) using a virtual balance—there is no real-money wagering. Users start with $100.00 of virtual currency (stored as `10000` cents) and can purchase more credits via in-app purchase through RevenueCat.

- **Platform:** iOS and Android (React Native / Expo)
- **Language:** Spanish throughout all UI copy and error messages
- **Core loop:** Browse markets → Place bet → Await settlement → Win/lose credits
- **Revenue model:** In-app purchase of virtual credit packages via RevenueCat

---

## 2. Tech Stack

### Client (Mobile App)
| Technology | Version | Role |
|---|---|---|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.32 | Dev toolchain, build system |
| TypeScript | ~5.9.2 | Type safety |
| React | 19.1.0 | UI rendering |
| NativeWind | ^4.0.1 | Tailwind CSS for React Native |
| TailwindCSS | ^3.4.17 | Utility CSS base |
| React Navigation (Native Stack) | ^7.9.0 | Screen navigation |
| React Navigation (Bottom Tabs) | ^7.9.0 | Tab bar navigation |
| TanStack Query | ^5.83.0 | Server state caching |
| `react-native-purchases` | ^9.0.0 | RevenueCat IAP SDK |
| `expo-notifications` | ~0.32.16 | Push notifications |
| `@react-native-async-storage/async-storage` | ^2.1.0 | Local persistence |
| `react-native-reanimated` | ~4.1.1 | Animations |
| `expo-linear-gradient` | ^15.0.8 | Gradient backgrounds |
| `react-native-confetti-cannon` | ^1.5.2 | Win celebration |
| `react-native-toast-message` | ^2.2.0 | Toast notifications |
| `@expo/vector-icons` (Ionicons) | ^15.0.3 | Icons |
| `class-variance-authority` + `clsx` + `tailwind-merge` | latest | Conditional class styling |

### Backend (Firebase)
| Technology | Version | Role |
|---|---|---|
| Firebase JS SDK | ^11.10.0 | Client-side Firebase access |
| Firestore | — | Primary database |
| Firebase Auth | — | Authentication (Email/Password) |
| Firebase Storage | — | Media assets |
| Cloud Functions | firebase-functions ^5.0.0 | Server-side logic |
| firebase-admin | ^12.0.0 | Admin SDK in functions |
| Node.js (functions) | 20 | Functions runtime |

### External Services
| Service | Role |
|---|---|
| RevenueCat | In-app purchase management and webhook delivery |
| Expo Push Notification Service | Push notification delivery |

---

## 3. Architecture

### Directory Structure

```
/Users/gabemeredith/Code/Posta/Posta/
├── App.tsx                    # Root component: providers, navigation shell, RevenueCat init
├── app.json                   # Expo config (bundle ID, permissions, etc.)
├── package.json               # Client dependencies
├── tailwind.config.js         # Tailwind / NativeWind config
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel config (Expo preset)
│
├── screens/                   # Full-page screen components
│   ├── WelcomeScreen.tsx      # Landing / sign-in prompt
│   ├── SignupScreen.tsx        # Multi-step registration
│   ├── CountrySelection.tsx    # Country picker during onboarding
│   ├── TermsAcceptanceScreen.tsx  # T&C gate (TERMS_STORAGE_KEY)
│   ├── HomeScreen.tsx          # Market browser (main tab)
│   ├── ActivityScreen.tsx      # Bet history (activity tab)
│   ├── ProfileScreen.tsx       # User profile (profile tab)
│   ├── NotificationsScreen.tsx # Push notification permission flow
│   ├── NotificationsHistoryScreen.tsx  # In-app notification list
│   ├── PaymentMethodsScreen.tsx  # Payment methods (UI exists, not functional)
│   └── CountryBettingScreen.tsx  # Country-specific market variant
│
├── components/                # Shared reusable UI components
│   ├── LoadingScreen.tsx
│   ├── BottomNav.tsx          # Custom bottom navigation (replaces default tab bar)
│   ├── MarketCard.tsx         # Market list item
│   ├── BetModal.tsx           # Bet placement modal
│   ├── SettlementModal.tsx    # Market settlement UI (admin)
│   └── ui/                   # Primitive UI components (Button, Input, Card, etc.)
│
├── contexts/
│   └── AuthContext.tsx        # Global auth state + RevenueCat integration
│
├── hooks/
│   ├── useAuth.ts             # Thin wrapper over AuthContext
│   ├── useMarkets.ts          # Real-time market subscriptions by category
│   ├── useBets.ts             # User bet history + placeBet action
│   ├── useUserProfile.ts      # User profile fetch/update
│   └── useNotificationPermission.ts  # Push permission request flow
│
├── services/                  # Firebase abstraction layer
│   ├── auth.service.ts        # Firebase Auth wrappers (Spanish error messages)
│   ├── user.service.ts        # Firestore user CRUD
│   ├── bet.service.ts         # Bet placement + queries via Cloud Functions
│   ├── purchase.service.ts    # RevenueCat singleton
│   ├── notification.service.ts
│   └── index.ts              # Central re-export
│
├── lib/
│   ├── firebaseConfig.ts      # Firebase init → exports: auth, db, storage, functions
│   ├── firestore.ts           # Typed Firestore query helpers + real-time subscriptions
│   ├── functions.ts           # Cloud Function call wrappers
│   ├── currency.ts            # formatCents(), dollarsToCents(), centsToDollars(), etc.
│   ├── expoPushToken.ts       # Push token request + refresh logic
│   ├── storage.ts             # AsyncStorage wrapper (getItem, setItem, removeItem, clear)
│   └── utils.ts               # General utilities
│
├── types/
│   ├── index.ts               # Category, Market, CountryBet types
│   └── purchase.ts            # CreditPackageId enum, PurchaseResult, OfferingsResult
│
├── constants/
│   ├── Colors.ts              # Full color palette (see Section 7)
│   └── Layout.ts              # BOTTOM_NAV_HEIGHT
│
└── firebase/                  # Firebase backend project
    ├── firebase.json           # Firebase project config (hosting, functions, rules)
    ├── firestore.rules         # Firestore security rules
    ├── firestore.indexes.json  # Composite index definitions
    ├── types/
    │   └── firestore.types.ts  # Canonical TypeScript types for all Firestore docs
    └── functions/
        ├── package.json        # Functions dependencies (firebase-admin ^12, firebase-functions ^5)
        └── src/
            ├── index.ts        # Function exports entry point
            ├── bets/
            │   ├── placeBet.ts    # placeBet Cloud Function
            │   └── settleBets.ts  # settleMarket Cloud Function
            ├── markets/
            │   ├── marketScheduler.ts  # scheduledMarketStatus (every 1 min) + createMarket
            │   ├── updateOdds.ts       # updateMarketOdds + recalculateMarketOdds
            │   └── deleteMarket.ts     # deleteMarket (admin only)
            ├── notifications/
            │   └── sendPushNotification.ts  # sendMarketOpenNotification, sendCustomNotification, markNotificationRead
            └── payments/
                └── revenuecatWebhook.ts     # HTTPS webhook handler for RevenueCat purchases
```

---

## 4. Core Data Models

> **Source of truth:** `firebase/types/firestore.types.ts`
> **Critical invariant:** ALL monetary values are stored as **integer cents** (divide by 100 for display).

### `users/{uid}`

```typescript
interface User {
  uid: string;                  // = Firebase Auth UID = document ID
  email: string;
  phoneNumber: string | null;   // e.g. "+5491234567"
  phoneCode: string | null;     // e.g. "+54"
  firstName: string;
  lastName: string;
  username: string;             // Unique, lowercase, max 20 chars (firstName+lastName)
  dateOfBirth: Timestamp;
  countryCode: string;          // ISO 2-letter e.g. "AR"
  friendCode: string;           // Unique referral code e.g. "DIEGO323" (firstName + 3 random digits)
  virtualBalance: number;       // INTEGER CENTS — initial: 10000 ($100.00)
  totalPositions: number;       // All-time bet count
  activePositions: number;      // Currently pending bets
  winRate: number;              // 0-100 percentage
  totalWinnings: number;        // Cumulative winnings in CENTS
  totalLosses: number;          // Cumulative losses in CENTS
  notificationsEnabled: boolean;
  notificationPreferences: {
    liveMarkets: boolean;
    marketResults: boolean;
    promotions: boolean;
  };
  expoPushToken?: string;       // Updated by App.tsx on login
  termsAccepted: boolean;
  termsAcceptedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  referredBy: string | null;    // Referrer UID (referral system incomplete — always null currently)
  isAdmin: boolean;             // Checked by Cloud Functions for admin-only operations
}
```

### `markets/{marketId}`

```typescript
type MarketStatus = "draft" | "open" | "locked" | "settled" | "cancelled";
type MarketResult = "si" | "no" | "cancelled";
type MarketCategory = "en_vivo" | "partidos" | "torneos" | "fase_grupos" | "jugadores";

interface Market {
  id: string;
  question: string;
  description?: string;
  category: MarketCategory;
  siProbability: number;        // 0-100, starts at 50
  noProbability: number;        // 0-100, starts at 50
  countryBets?: CountryBet[];   // Optional country-specific variant
  totalVolume: number;          // Total CENTS bet
  totalBets: number;
  uniqueBettors: number;
  siVolume: number;             // CENTS on "Sí" side
  noVolume: number;             // CENTS on "No" side
  status: MarketStatus;
  isUrgent: boolean;            // True = EN VIVO (live) market, has lockAt
  openAt: Timestamp;
  lockAt?: Timestamp;           // When betting closes; scheduler locks it automatically
  settledAt?: Timestamp;
  result?: MarketResult;
  resultVerifiedBy?: string;    // Admin UID
  createdBy: string;            // Admin UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  imageUrl?: string;
}
```

### `userBets/{betId}`

```typescript
type BetStatus = "pending" | "won" | "lost" | "refunded";

interface UserBet {
  id: string;
  userId: string;
  marketId: string;
  marketQuestion: string;       // Denormalized
  marketCategory: string;       // Denormalized
  side: "si" | "no";
  amount: number;               // INTEGER CENTS
  probability: number;          // Snapshot at time of bet (0-100)
  potentialWin: number;         // INTEGER CENTS — formula: floor((amount * 100) / probability)
  countryCode?: string;
  status: BetStatus;
  actualWin?: number;           // INTEGER CENTS (filled on settlement)
  settledAt?: Timestamp;
  placedAt: Timestamp;
  createdAt: Timestamp;
}
```

### `markets/{marketId}/bets/{betId}`

```typescript
interface MarketBet {
  id: string;
  userId: string;
  username: string;             // Denormalized for leaderboards
  side: "si" | "no";
  amount: number;               // INTEGER CENTS
  probability: number;
  potentialWin: number;         // INTEGER CENTS
  countryCode?: string;
  placedAt: Timestamp;
}
```

### `transactions/{transactionId}`

```typescript
type TransactionType = "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "bet_refund" | "referral_bonus";
type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;               // INTEGER CENTS (negative for bet_placed)
  balanceBefore: number;        // INTEGER CENTS
  balanceAfter: number;         // INTEGER CENTS
  description: string;
  betId?: string;
  marketId?: string;
  paymentProvider?: string;     // "revenuecat" for IAP deposits
  providerId?: string;
  productId?: string;
  status: TransactionStatus;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

### `users/{uid}/notifications/{notificationId}`

```typescript
interface UserNotification {
  id: string;
  type: "market_live" | "bet_result" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  marketId?: string;
  betId?: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

### Credit Package IDs (IAP)

```typescript
// types/purchase.ts
enum CreditPackageId {
  CREDITS_100 = "credits_100",   // 10,000 cents
  CREDITS_500 = "credits_500",   // 50,000 cents
  CREDITS_1000 = "credits_1000", // 100,000 cents
  CREDITS_2500 = "credits_2500", // 250,000 cents
}
```

---

## 5. API / Interface Layer

### Cloud Functions (all in `us-central1`)

These are the only authorized write paths for sensitive data. All are callable via `lib/functions.ts`.

| Function | Type | Auth Required | Admin Required | Purpose |
|---|---|---|---|---|
| `placeBet` | `onCall` | Yes | No | Place a bet (atomic, rate-limited) |
| `settleMarket` | `onCall` | Yes | Yes (`isAdmin=true`) | Settle a market + all pending bets |
| `updateMarketOdds` | `onCall` | Yes | Yes | Manually update market odds |
| `recalculateMarketOdds` | `onCall` | Yes | Yes | Recalculate odds from volume |
| `createMarket` | `onCall` | Yes | Yes | Create a new betting market |
| `deleteMarket` | `onCall` | Yes | Yes | Delete a market |
| `scheduledMarketStatus` | `pubsub` (every 1 min) | — | — | Auto-lock EN VIVO markets past `lockAt` |
| `sendMarketOpenNotification` | `onCall` | Yes | Yes | Push notification for market open |
| `sendCustomNotification` | `onCall` | Yes | Yes | Custom push + in-app notification |
| `markNotificationRead` | `onCall` | Yes | No | Mark a notification as read |
| `revenueCatWebhook` | `onRequest` (HTTPS POST) | HMAC sig | — | Credit user balance on IAP |

### Client-Side Service Layer

**`lib/functions.ts`** — wraps `httpsCallable(functions, 'functionName')`:
- `placeBet(marketId, side, amount, countryCode?)` → `{ success, betId, newBalance, potentialWin }`
- `settleMarket(marketId, result)` → `{ success, message, settledCount, result }`
- `recalculateMarketOdds(marketId)` → `{ success }`
- `createMarket(data)` → `{ success, marketId, status }`
- `sendCustomNotification(userId, title, message, type, marketId?, betId?)` → `{ success }`
- `markNotificationRead(notificationId)` → `{ success }`

**`lib/firestore.ts`** — typed Firestore query helpers:
- `getUser(uid)` / `subscribeToUser(uid, callback)`
- `getMarkets(category, status?)` / `subscribeToMarkets(category, callback)`
- `getMarket(marketId)` / `subscribeToMarket(marketId, callback)`
- `getUserBets(userId, status?)` / `subscribeToUserBets(userId, status?, callback)`
- `getTransactions(userId)`
- `getUserNotifications(userId)` / `subscribeToUserNotifications(userId, callback)`
- `formatRelativeTime(timestamp)` / `formatVolume(cents)`

**`services/auth.service.ts`** — Firebase Auth wrappers:
- `signUpWithEmail(email, password)` → `FirebaseUser`
- `signInWithEmail(email, password)` → `FirebaseUser`
- `signOut()` → `void`
- `resetPassword(email)` → `void`
- `onAuthStateChanged(callback)` → unsubscribe function

**`services/purchase.service.ts`** — RevenueCat singleton (`purchaseService`):
- `loginUser(uid)` — called on every auth state change
- `logoutUser()` — called on sign out
- `getOfferings()` → `OfferingsResult`
- `purchasePackage(package)` → `PurchaseResult`
- `restorePurchases()` → `PurchaseResult`
- `getCustomerInfo()` → RevenueCat `CustomerInfo`
- `hasActiveEntitlement(entitlementId)` → `boolean`

---

## 6. Key Business Logic

### Bet Placement (`firebase/functions/src/bets/placeBet.ts`)

The most critical function. **Must be atomic; never accept direct Firestore writes from clients.**

```
1. Auth guard → must be authenticated
2. Input validation:
   - amount must be positive integer (CENTS)
   - minimum 100 cents ($1.00)
   - side must be "si" or "no"
3. Rate-limit check (OUTSIDE transaction):
   - Read last bet timestamp for user
   - Reject if < 10 seconds since last bet (throws "resource-exhausted")
4. Firestore Transaction (atomic):
   a. Read + lock user doc → check virtualBalance >= amount
   b. Read market doc → check status == "open", check lockAt not passed
   c. Calculate potentialWin:
      - potentialWin = floor((amount * 100) / probability)  ← INTEGER ARITHMETIC
   d. Write userBets/{betId} (full bet record)
   e. Write markets/{marketId}/bets/{betId} (denormalized for leaderboards)
   f. Update user: virtualBalance -= amount, totalPositions++, activePositions++
   g. Update market: totalVolume, totalBets, siVolume/noVolume
   h. Write transactions/{txId} (type: "bet_placed", amount: -amount)
5. Return { success, betId, newBalance, potentialWin }
```

### Market Settlement (`firebase/functions/src/bets/settleBets.ts`)

Admin-only. Processes all pending bets in a market.

```
1. Auth + isAdmin check (reads users/{uid}.isAdmin)
2. Update market: status="settled", result, resultVerifiedBy, settledAt
3. For each pending bet in markets/{marketId}/bets:
   - "cancelled" result → status="refunded", balanceChange=amount
   - betSide matches result → status="won", balanceChange=potentialWin
   - betSide does not match → status="lost", balanceChange=0
4. If balanceChange > 0:
   - userBets/{betId}: update status, actualWin, settledAt
   - users/{uid}: FieldValue.increment(balanceChange), update stats
   - transactions/{txId}: type="bet_won" or "bet_refund"
5. Send in-app notifications (Firestore) + push notifications (Expo batch, ≤100 tokens/request)
```

### RevenueCat Webhook (`firebase/functions/src/payments/revenuecatWebhook.ts`)

Handles IAP → credit conversion. Security-critical.

```
1. Reject non-POST
2. Verify X-Revenuecat-Signature header (HMAC-SHA256, timing-safe compare)
   - Secret stored in Firebase Secret Manager as REVENUECAT_WEBHOOK_SECRET
3. Only process "INITIAL_PURCHASE" and "NON_RENEWING_PURCHASE" events
4. Idempotency: check users/{uid}/transactions/{transactionId} exists → skip if duplicate
5. CREDIT_AMOUNTS map: { credits_100: 10000, credits_500: 50000, credits_1000: 100000, credits_2500: 250000 }
6. Atomic transaction: update virtualBalance + write transaction record
7. Balance cap: 1,000,000,000 cents ($10,000,000.00)
```

### Market Auto-Lock (`firebase/functions/src/markets/marketScheduler.ts`)

Scheduled every 1 minute via Cloud Scheduler.

```
Query: markets where status="open" AND isUrgent=true
For each: if lockAt < now → batch update status="locked"
```

### Odds Formula

```
potentialWin = floor((amount * 100) / probability)
```

Example: $10 bet at 60% probability → `floor((1000 * 100) / 60)` = `1666` cents = $16.66 payout

### Username Generation (on signup)

```typescript
// AuthContext.tsx:172
const username = `${firstName.toLowerCase().trim()}${lastName.toLowerCase().trim()}`.slice(0, 20);
```

### Friend Code Generation

```typescript
// user.service.ts: generateFriendCode()
// Format: firstName (capitalized) + 3 random digits → e.g. "DIEGO323"
```

### Push Token Lifecycle

App.tsx subscribes to `Notifications.addPushTokenListener` after login. On any token change, calls `updateUserProfile(uid, { expoPushToken })` to keep Firestore in sync. Gracefully suppresses errors for Expo Go / missing projectId environments.

---

## 7. Conventions & Patterns

### CRITICAL: Currency Rule

**ALL monetary values are integer cents throughout the stack.** Never store floats. Always divide by 100 for display only.

```typescript
// lib/currency.ts
formatCents(1000)         // → "$10.00"
dollarsToCents(10)        // → 1000
centsToDollars(1000)      // → 10
formatCentsCompact(1500000) // → "$15K"
isValidCents(amount)      // → true if positive integer
```

### Color System (`constants/Colors.ts`)

```typescript
Colors.primary500    // "#F97316"  — orange, buttons, active states
Colors.primary400    // "#FF9F5A"  — light orange, gradients
Colors.success       // "#E7642D"  — "Sí" bets, wins (orange variant)
Colors.destructive   // "#1f406e"  — "No" bets, losses (dark blue)
Colors.background    // "#FAFAFA"
Colors.card          // "#FFFFFF"
Colors.foreground    // "#1A1A1A"
Colors.foregroundMuted // "#737373"
Colors.border        // "#E5E5E5"
Colors.overlay       // "#00000066"
```

### Naming Conventions

- Components / Screens / Types / Interfaces: `PascalCase`
- Functions / methods / hooks: `camelCase`
- Storage keys / constants: `UPPER_SNAKE_CASE` (e.g., `TERMS_STORAGE_KEY`, `BOTTOM_NAV_HEIGHT`)
- Files: `PascalCase.tsx` for components/screens, `camelCase.ts` for utilities/services
- Tailwind classes: NativeWind utility classes (same syntax as web Tailwind)

### React Patterns

- **Functional components only** — no class components anywhere
- **Custom hooks** for all data fetching (`useMarkets`, `useBets`, `useUserProfile`)
- **Single `onAuthStateChanged` listener** in `AuthContext.tsx` — never add more
- **`useRef(isProcessingRef)`** guards against duplicate auth processing
- **`useMemo` on context value** to prevent unnecessary consumer re-renders
- **`useCallback` on all handlers** passed down as props or into context
- **TanStack Query** (`QueryClient` in `App.tsx`) wraps the tree for cache management
- **Cleanup returns** in all `useEffect` calls that subscribe to Firestore or notifications

### Firebase Patterns

- **Cloud Functions for all writes** to `userBets`, `transactions`, `markets/bets` — never direct client writes
- **Firestore transactions** for atomic multi-document operations (bet placement)
- **`FieldValue.increment()`** for concurrent balance updates in settlement
- **Batch writes** for bulk updates (settlement of many bets), max 500 per batch
- **Denormalized data**: `username` and `marketQuestion` stored in bets for fast queries without joins
- **`onSnapshot()` subscriptions** always returned and cleaned up

### Auth State Design

The `AuthContext.tsx` auth flow has deliberate constraints:
- `handleSignIn` does NOT set loading=false or update user state — it lets `onAuthStateChanged` handle all state changes to prevent race conditions
- `handleSignUp` DOES set state directly (since `onAuthStateChanged` would also fire, creating duplicate processing)
- RevenueCat login/logout is always wrapped in try-catch and never blocks auth flow

### Logging Style

Emoji-prefixed console logs throughout for development readability:
- `✅` — success
- `❌` — error / rejection
- `⏳` — loading / in progress
- `📤` — outgoing request
- `📥` — incoming response
- `⏭️` — skipping / no-op
- `🔐` — auth operation
- `📱` — notification or mobile event

### Storage Keys (AsyncStorage)

- `TERMS_STORAGE_KEY` — exported from `TermsAcceptanceScreen.tsx`, checked in `App.tsx`
- `posta_user` — user cache (cleared on sign out)
- `posta_country` — country selection (cleared on sign out)
- `posta_notifications` — notification preferences (cleared on sign out)

### Firestore Security Rule Pattern

All security-sensitive writes are blocked at the rules level and must go through Cloud Functions (which use the Admin SDK, bypassing rules):

```
// Key principle: userBets and transactions are READ-only to clients
// All writes happen via Cloud Functions
```

---

## 8. What NOT To Do

### Never Do These

1. **Do not store monetary values as floats.** Everything is integer cents. `0.1 + 0.2 !== 0.3` in floating-point; the entire system is designed to avoid this.

2. **Do not write directly to `userBets`, `transactions`, or `markets/{id}/bets` from the client.** These collections are locked by Firestore security rules and must only be written by Cloud Functions.

3. **Do not add a second `onAuthStateChanged` listener.** There is one in `AuthContext.tsx`. Adding another will cause duplicate processing, infinite loops, or race conditions. All auth state flows through `AuthContext`.

4. **Do not call `RevenueCat.configure()` more than once.** It is initialized once in `App.tsx`'s root `useEffect` and managed as a singleton via `purchase.service.ts`.

5. **Do not use the Firebase client SDK to read admin-only data.** `isAdmin` status is checked server-side in Cloud Functions; client code cannot be trusted for authorization.

6. **Do not add RevenueCat-dependent code paths that run in Expo Go.** RevenueCat native modules are unavailable in Expo Go and the code silently suppresses the resulting errors. Any purchase flow must go through a development build.

7. **Do not navigate inside `App.tsx`'s notification listener** until `MarketDetailScreen` is built and added to the navigator. The TODO comment at `App.tsx:183` marks this intentionally deferred.

8. **Do not divide by 100 before storing.** Only divide for display. Store raw cents.

9. **Do not create additional Firebase app initializations.** `lib/firebaseConfig.ts` calls `initializeApp()` once and exports `auth`, `db`, `storage`, `functions`.

10. **Do not implement the referral/friend-code redemption logic on the client.** The `referredBy` field in `createUserProfile()` is intentionally set to `undefined` with a TODO comment. Server-side lookup must be implemented in a Cloud Function.

### Known Tech Debt

- `AuthContext.tsx:193` — `referredBy: userData.friendCode ? undefined : undefined` — referral lookup not implemented
- `App.tsx:183` — Notification tap → `MarketDetailScreen` navigation is stubbed with a TODO
- `PaymentMethodsScreen.tsx` — UI exists but the screen is not functional
- Admin panel date localization: dates display in Spanish (should be English)
- Multiple users betting simultaneously (concurrency under heavy load) has not been stress-tested
- Push notification reliability under high settlement volume needs end-to-end testing

---

## 9. Environment & Config

### Environment Variables

Create a `.env` file at the root (`.env.example` is committed):

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxx
```

The `EXPO_PUBLIC_` prefix is required for Expo to expose variables to the client bundle.

### Firebase Secret (Cloud Functions)

```bash
firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET
```

This secret is used to verify RevenueCat webhook HMAC signatures in `revenuecatWebhook.ts`.

### Firebase Project

- **Project ID:** `porta-main`
- **Auth domain:** `porta-main.firebaseapp.com`
- **Functions region:** `us-central1`
- **Config is hardcoded** in `lib/firebaseConfig.ts` (Firebase public config is safe to expose per Firebase security model — rules enforce access control)

### Running Locally

```bash
# Install client dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Functions: build and serve with emulator
cd firebase/functions
npm install
npm run serve   # = tsc && firebase emulators:start --only functions

# Deploy functions
cd firebase/functions
npm run deploy  # = firebase deploy --only functions

# View function logs
npm run logs
```

> **Note:** RevenueCat only works on real development builds, not Expo Go or simulators. All other functionality works in Expo Go except IAP.

### Firestore Indexes

Defined in `firebase/firestore.indexes.json`. Key composite indexes:
- `markets`: `(category, status, openAt DESC)` — market browsing
- `markets`: `(status, isUrgent, lockAt)` — scheduler query
- `userBets`: `(userId, placedAt DESC)` — bet history
- `userBets`: `(userId, status, placedAt DESC)` — filtered bet history
- `userBets`: `(marketId, status, placedAt DESC)` — settlement query
- `transactions`: `(userId, createdAt DESC)` — transaction history

Deploy indexes: `firebase deploy --only firestore:indexes`

---

## 10. Current State

### Working

- Full authentication flow (sign up, sign in, sign out, password reset)
- Terms acceptance gate (AsyncStorage-persisted)
- Market browsing by category with real-time Firestore subscriptions
- Bet placement (atomic, rate-limited, with full transaction audit trail)
- Market settlement by admins (with won/lost/refunded outcomes)
- Virtual balance tracking (all integer cents)
- In-app notifications (Firestore-based)
- Push notifications via Expo Push Service (sent on market open and bet settlement)
- RevenueCat IAP integration (credit packages: 100, 500, 1000, 2500)
- RevenueCat webhook → balance top-up (idempotent, HMAC-verified)
- Country-specific market variant (`CountryBettingScreen`)
- Scheduled auto-lock for EN VIVO markets (every 1 minute)
- User profile with stats (win rate, active positions, total winnings)

### Incomplete / Not Working

- **`MarketDetailScreen`** — not implemented; notification taps to market detail are a no-op (see `App.tsx:183`)
- **Referral system** — `friendCode` is collected but `referredBy` is never set; no referral bonus logic exists
- **`PaymentMethodsScreen`** — UI shell exists, not functional
- **Admin panel date localization** — dates show in Spanish

### Known Issues / TODOs from README

> - Make sure notifications work and improve the notifications UI
> - Test multiple users betting simultaneously; explain how betting works
> - Make the dates be in English in the admin panel
> - Add margin right to chevrons in the admin panel
> - Make sure "posiciones activas" (active positions) works correctly

### Recent Git Activity (as of Feb 2026)

- `5d8b599` — Enhance RevenueCat error handling for login and initialization
- `91e05d4` — Add SafeAreaView import to HomeScreen
- `07e867b` — Improve authentication and user profile handling with logging
- `223ef5c` — Improve bet placement and settlement atomicity (Firestore transactions + FieldValue.increment)
- `567c315` — Security enhancements
