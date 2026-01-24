# Liberta - Application Overview

## Purpose

Liberta is a real-time sports betting mobile application designed for Spanish-speaking markets in Latin America. The app enables users to place virtual bets on various sports markets with dynamic odds that update in real-time based on betting activity.

## Target Audience

- Spanish-speaking users in LATAM countries (Argentina, Mexico, Brazil, Colombia, Chile, Peru, Ecuador)
- Sports enthusiasts interested in betting on matches, tournaments, and player performances
- Users seeking an engaging, real-time betting experience with instant updates

## Core Features

### 1. Real-Time Betting Markets
- Live betting markets with dynamic odds that update as users place bets
- Multiple market categories: EN VIVO (live), Partidos (matches), Torneos (tournaments), Fase de Grupos (group stage), Jugadores (players)
- Market status tracking: Draft → Open → Locked → Settled/Cancelled

### 2. Virtual Balance System
- Users start with a virtual balance (not real money)
- All bets use virtual currency
- Balance updates immediately after placing bets
- Winnings are added to balance when bets are settled

### 3. Real-Time Updates
- Market odds update instantly as bets are placed
- User balance updates immediately after bet placement
- Bet status updates in real-time (pending → won/lost)
- Notifications appear instantly for market openings and bet results

### 4. User Profiles & Statistics
- User profiles with personal information and preferences
- Betting statistics: total positions, active positions, win rate, total winnings/losses
- Friend codes for referrals
- Notification preferences

### 5. Activity Tracking
- View all bets (pending, won, lost, refunded)
- Filter bets by status
- Track bet history with market details and potential/actual winnings

### 6. Notifications
- Market opening notifications
- Bet result notifications
- Promotional notifications
- System notifications
- Unread notification count

## Market Categories

1. **EN VIVO** - Live betting markets with urgent timing
   - Markets that lock at a specific time
   - Auto-lock functionality via scheduled Cloud Function
   - Urgent flag for highlighting in UI

2. **Partidos** - Match-specific betting markets
   - Questions about specific matches
   - Can be pre-match or live

3. **Torneos** - Tournament-level markets
   - Questions about tournament outcomes
   - Longer-term markets

4. **Fase de Grupos** - Group stage markets
   - Questions about group stage results
   - Tournament-specific markets

5. **Jugadores** - Player-specific markets
   - Questions about individual player performances
   - Player statistics and achievements

## User Flow

1. **Onboarding**
   - Accept Terms & Conditions
   - Sign up with email/password
   - Provide personal information (name, date of birth, country)
   - Optional: Enter friend code for referral

2. **Authentication**
   - Login with email/password
   - Auth state persists across app restarts
   - Automatic profile verification

3. **Browse Markets**
   - View markets by category
   - Filter by status (open, locked, settled)
   - See real-time odds and volume
   - View market details and betting history

4. **Place Bets**
   - Select a market
   - Choose side: "Sí" (Yes) or "No"
   - Enter bet amount (must not exceed balance)
   - Confirm bet placement
   - Receive instant confirmation and balance update

5. **Track Activity**
   - View all bets in Activity screen
   - Filter by status (pending, won, lost, refunded)
   - See bet details, potential winnings, and actual results
   - Monitor balance changes

6. **Receive Notifications**
   - Get notified when markets open
   - Receive bet result notifications
   - View notification history
   - Mark notifications as read

## Key Business Rules

### Market Lifecycle

1. **Draft** - Market created by admin, not visible to users
2. **Open** - Betting is active, odds update in real-time based on bet volume
3. **Locked** - Betting closed (EN VIVO markets auto-lock at `lockAt` time)
4. **Settled** - Admin declares result (si/no), bets are resolved, users receive winnings
5. **Cancelled** - Market cancelled, all bets refunded to users

### Odds Calculation

- Odds are calculated based on bet volume on each side
- `siProbability` = (siVolume / totalVolume) * 100
- `noProbability` = (noVolume / totalVolume) * 100
- Odds update automatically when bets are placed via Cloud Function triggers
- Potential win = betAmount / (probability / 100)

### Betting Rules

- Users can only bet on markets with status "open"
- Bet amount must not exceed user's virtual balance
- EN VIVO markets automatically lock at their `lockAt` timestamp
- Once a market is locked, no new bets can be placed
- Bets are resolved when admin settles the market

### Balance Management

- All balance updates happen atomically via Cloud Functions
- Balance decreases when bet is placed
- Balance increases when bet wins (by potential win amount)
- Balance refunded when bet loses or market is cancelled
- Transaction history tracks all balance changes

### Referral System

- Users have unique friend codes
- Friend codes can be entered during signup
- Referral bonuses can be awarded (future feature)

## Technology Stack Overview

### Frontend
- **React Native** with Expo framework
- **TypeScript** for type safety
- **React Navigation** for navigation (Stack + Tab navigators)
- **TanStack Query** for data fetching and caching
- **NativeWind** (Tailwind CSS) for styling
- **Firebase SDK** for authentication and Firestore access

### Backend
- **Firebase Authentication** for user authentication
- **Cloud Firestore** for database (NoSQL)
- **Cloud Functions** (Node.js 20) for server-side logic
- **Firebase Security Rules** for data access control

### Infrastructure
- **Firebase Project**: liberta-main
- **Region**: us-central1
- **Runtime**: Node.js 20 (Cloud Functions)
- **Billing**: Blaze (Pay-as-you-go)

## Data Flow

```
User Action → UI Component → Custom Hook → Service Layer → Firebase/Firestore
                                                                    ↓
                                                          Real-time Updates
                                                                    ↓
                                                          Hook → Component → UI Update
```

## Key Architectural Patterns

1. **Service Layer Pattern** - Abstracts Firebase operations
2. **Custom Hooks Pattern** - Manages state and real-time subscriptions
3. **Context API** - Global auth state management
4. **Type Safety** - TypeScript interfaces for all Firestore documents
5. **Real-time Subscriptions** - Firestore listeners for live updates

## Security

- User data is protected by Firestore security rules
- Users can only read/update their own data
- Markets are publicly readable, admin-writable
- Bets can only be created via Cloud Functions (prevents cheating)
- Admin functions require `isAdmin: true` flag in user document
- User balances can only be modified by Cloud Functions

## Future Enhancements

- Profile editing UI
- Transaction history screen
- Friend code validation and referral bonuses
- Username uniqueness validation
- Offline support with bet queue
- Search functionality for markets
- Payment methods integration (MercadoPago, Stripe)
- Withdrawal functionality
