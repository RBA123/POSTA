# Liberta - Frontend Architecture

## Technology Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library (Stack + Tab navigators)
- **TanStack Query** - Data fetching, caching, and synchronization
- **NativeWind** - Tailwind CSS for React Native
- **Firebase SDK** - Authentication and Firestore client libraries

## Project Structure

```
Liberta/
├── App.tsx                    # Main app entry point, navigation setup
├── components/                # Reusable UI components
│   ├── ui/                    # Base UI components (Button, Card, Input)
│   ├── BetModal.tsx          # Bet placement modal
│   ├── BottomNav.tsx         # Custom bottom navigation
│   ├── ConfettiAnimation.tsx # Celebration animation
│   ├── CountdownBanner.tsx   # Market countdown timer
│   ├── LoadingScreen.tsx     # Loading state component
│   └── MarketCard.tsx        # Market display card
├── screens/                   # Screen components
│   ├── WelcomeScreen.tsx     # Login screen
│   ├── SignupScreen.tsx      # Registration screen
│   ├── HomeScreen.tsx        # Markets browsing
│   ├── ActivityScreen.tsx    # Bet history
│   ├── ProfileScreen.tsx     # User profile
│   └── ...
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts            # Auth state hook
│   ├── useUserProfile.ts     # User profile hook
│   ├── useMarkets.ts         # Markets data hook
│   ├── useBets.ts            # Bets management hook
│   └── useNotifications.ts    # Notifications hook
├── services/                  # Service layer (Firebase abstractions)
│   ├── auth.service.ts       # Authentication operations
│   ├── user.service.ts       # User profile CRUD
│   ├── bet.service.ts        # Bet operations
│   ├── notification.service.ts # Notification operations
│   └── index.ts              # Central exports
├── contexts/                  # React Context providers
│   └── AuthContext.tsx       # Global auth state
├── lib/                       # Utility libraries
│   ├── firebaseConfig.ts     # Firebase initialization
│   ├── firestore.ts          # Firestore helpers (legacy)
│   ├── functions.ts          # Cloud Functions wrappers (legacy)
│   ├── storage.ts            # Local storage helpers
│   └── utils.ts              # General utilities
├── types/                     # TypeScript type definitions
│   ├── index.ts              # Frontend types
│   └── navigation.ts         # Navigation types
├── constants/                 # App constants
│   ├── Colors.ts             # Color palette
│   └── Layout.ts             # Layout constants
└── firebase/                  # Firebase configuration
    ├── types/
    │   └── firestore.types.ts # Firestore document types
    └── functions/            # Cloud Functions (backend)
```

## Navigation Architecture

### Navigation Structure

The app uses a combination of Stack and Tab navigators:

1. **Root Stack Navigator** (`App.tsx`)
   - Handles authentication flow
   - Shows Terms acceptance screen
   - Contains main app stack

2. **Tab Navigator** (Main App)
   - HomeTab - Markets browsing
   - ActivityTab - Bet history
   - ProfileTab - User profile

3. **Modal Stack** (within main app)
   - Notifications screen
   - Payment Methods screen
   - Notifications History screen

### Navigation Flow

```
App Start
  ↓
Terms Acceptance (if not accepted)
  ↓
Auth Check
  ├─ Not Authenticated → WelcomeScreen → SignupScreen
  ├─ Authenticated (no profile) → WelcomeScreen → SignupScreen
  └─ Authenticated (with profile) → TabNavigator
                                      ├─ HomeTab (Markets)
                                      ├─ ActivityTab (Bets)
                                      └─ ProfileTab (Profile)
```

## State Management

### AuthContext Pattern

The app uses React Context for global authentication state:

- **AuthProvider** (`contexts/AuthContext.tsx`)
  - Manages Firebase Auth state
  - Handles signup, signin, signout
  - Checks for user profile existence
  - Provides auth state to entire app

- **useAuth Hook** (`hooks/useAuth.ts`)
  - Wrapper around AuthContext
  - Provides: `user`, `loading`, `profileExists`, `error`, `signUp`, `signIn`, `signOut`

### Custom Hooks Pattern

Each data domain has a custom hook that:
- Manages loading/error states
- Handles real-time Firestore subscriptions
- Provides data fetching functions
- Exposes clean API to components

**Hook Structure:**
```typescript
{
  data: T[],           // The data array
  loading: boolean,    // Loading state
  error: Error | null, // Error state
  refetch: () => void, // Manual refresh function
  // Domain-specific functions (e.g., placeBet, updateProfile)
}
```

### Available Hooks

1. **useAuth** (`hooks/useAuth.ts`)
   - Auth state and operations
   - Wraps AuthContext

2. **useUserProfile** (`hooks/useUserProfile.ts`)
   - User profile data
   - User statistics (balance, win rate, etc.)
   - Profile update function
   - Real-time profile updates

3. **useMarkets** (`hooks/useMarkets.ts`)
   - Markets data by category
   - Real-time market updates
   - Filtering by status
   - Refetch capability

4. **useBets** (`hooks/useBets.ts`)
   - User bets data
   - Filtering by status
   - Place bet function
   - Real-time bet updates

5. **useNotifications** (`hooks/useNotifications.ts`)
   - User notifications
   - Unread count
   - Mark as read function
   - Real-time notification updates

## Service Layer Pattern

The service layer abstracts Firebase operations and provides:
- Type-safe function signatures
- Consistent error handling
- Centralized Firebase logic
- Easy testing and mocking

### Service Modules

1. **auth.service.ts**
   - `signUpWithEmail(email, password)`
   - `signInWithEmail(email, password)`
   - `signOut()`
   - `getCurrentUser()`
   - `onAuthStateChanged(callback)`
   - `resetPassword(email)`

2. **user.service.ts**
   - `createUserProfile(uid, data)`
   - `getUserProfile(uid)`
   - `updateUserProfile(uid, data)`
   - `getUserStats(uid)`

3. **bet.service.ts**
   - `placeBet(marketId, side, amount)` - Calls Cloud Function
   - Wrapper around Cloud Function call

4. **notification.service.ts**
   - `getNotifications(userId)`
   - `markNotificationRead(userId, notificationId)`
   - `getUnreadCount(userId)`

## Data Flow Architecture

```
┌─────────────┐
│   Screen    │
│  Component  │
└──────┬──────┘
       │ uses
       ↓
┌─────────────┐
│ Custom Hook │ ← Real-time subscription
└──────┬──────┘
       │ calls
       ↓
┌─────────────┐
│   Service   │
│    Layer    │
└──────┬──────┘
       │ interacts with
       ↓
┌─────────────┐
│   Firebase  │
│  (Auth/DB)  │
└─────────────┘
```

### Example: Placing a Bet

1. User taps "Place Bet" button in `BetModal`
2. `BetModal` calls `useBets().placeBet(marketId, side, amount)`
3. Hook calls `bet.service.placeBet()` which calls Cloud Function
4. Cloud Function validates and creates bet atomically
5. Firestore updates trigger real-time listeners
6. Hook receives update and updates state
7. Component re-renders with new balance and bet list

## Screen Components

### HomeScreen (`screens/HomeScreen.tsx`)
- **Purpose**: Display and browse betting markets
- **Features**:
  - Category tabs (EN VIVO, Partidos, etc.)
  - Market cards with odds and volume
  - Real-time market updates
  - Bet placement modal
  - Countdown banners for EN VIVO markets
- **Hooks Used**: `useMarkets`, `useUserProfile`, `useBets`
- **Key State**: Selected category, selected market for betting

### ActivityScreen (`screens/ActivityScreen.tsx`)
- **Purpose**: Display user's betting history
- **Features**:
  - Filter by bet status (pending, won, lost, refunded)
  - Bet details (market, side, amount, potential/actual win)
  - Pull-to-refresh
- **Hooks Used**: `useBets`
- **Key State**: Selected filter status

### ProfileScreen (`screens/ProfileScreen.tsx`)
- **Purpose**: Display user profile and statistics
- **Features**:
  - User information display
  - Betting statistics (total positions, win rate, winnings)
  - Balance display
  - Navigation to settings/payment methods
- **Hooks Used**: `useUserProfile`, `useAuth`
- **Key State**: Profile data, stats

### WelcomeScreen (`screens/WelcomeScreen.tsx`)
- **Purpose**: Login screen
- **Features**:
  - Email/password login
  - Navigation to signup
  - Error handling
- **Hooks Used**: `useAuth`

### SignupScreen (`screens/SignupScreen.tsx`)
- **Purpose**: User registration
- **Features**:
  - Email/password signup
  - Personal information collection
  - Country selection
  - Friend code input
  - Creates Firebase Auth user and Firestore profile
- **Hooks Used**: `useAuth`

## Component Architecture

### UI Components (`components/ui/`)
Base reusable components:
- **Button.tsx** - Styled button component
- **Card.tsx** - Card container component
- **Input.tsx** - Text input component

### Feature Components

- **MarketCard.tsx**
  - Displays market information
  - Shows odds, volume, category
  - Handles market selection for betting

- **BetModal.tsx**
  - Bet placement interface
  - Side selection (Sí/No)
  - Amount input
  - Balance validation
  - Calls `useBets().placeBet()`

- **BottomNav.tsx**
  - Custom bottom navigation bar
  - Tab switching
  - Active tab highlighting

- **CountdownBanner.tsx**
  - Displays countdown for EN VIVO markets
  - Shows time until market locks

- **ConfettiAnimation.tsx**
  - Celebration animation for bet wins
  - Triggered when bet status changes to "won"

- **LoadingScreen.tsx**
  - Full-screen loading indicator
  - Used during auth checks and initial load

## Styling Approach

### NativeWind (Tailwind CSS)
- Utility-first CSS framework
- Consistent design system
- Responsive utilities
- Dark mode support (future)

### Color System (`constants/Colors.ts`)
- Primary colors for branding
- Foreground/background colors
- Muted colors for secondary text
- Status colors (success, error, warning)

### Layout Constants (`constants/Layout.ts`)
- Standard spacing values
- Bottom nav height
- Screen padding
- Component dimensions

## Type System

### Frontend Types (`types/index.ts`)
- `Category` - Market category enum
- `Market` - UI market interface (simplified from Firestore)

### Firestore Types (`firebase/types/firestore.types.ts`)
- Complete Firestore document interfaces
- `User`, `Market`, `UserBet`, `Transaction`
- `UserNotification`, `PaymentMethod`
- Helper types: `CreateUserInput`, `UpdateUserInput`, etc.

### Navigation Types (`types/navigation.ts`)
- Navigation param lists
- Screen prop types
- Route parameter types

## Real-Time Updates

### Firestore Subscriptions

Hooks use Firestore `onSnapshot` listeners for real-time updates:

```typescript
// Example from useMarkets
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    const markets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMarkets(markets);
    setLoading(false);
  });
  
  return () => unsubscribe();
}, [category, status]);
```

### Update Triggers

- **Market Updates**: When odds change (via Cloud Function trigger)
- **Bet Updates**: When bet status changes (via admin settlement)
- **Balance Updates**: Immediately after bet placement
- **Notifications**: When new notifications are created

## Error Handling

### Error States
- All hooks expose `error` state
- Services throw errors with user-friendly Spanish messages
- Components display errors via `Alert.alert()` (future: toast notifications)

### Error Types
- Network errors
- Authentication errors
- Validation errors
- Insufficient balance errors
- Market closed errors

## Performance Optimizations

1. **Memoization**: Context values memoized to prevent unnecessary re-renders
2. **Query Caching**: TanStack Query caches market data
3. **Lazy Loading**: Screens loaded on-demand
4. **Real-time Efficiency**: Single subscription per hook, cleaned up on unmount
5. **Batch Updates**: Cloud Functions handle multiple Firestore updates atomically

## Testing Considerations

- Services can be easily mocked for testing
- Hooks can be tested with React Testing Library
- Components are pure and testable
- Navigation can be tested with navigation testing utilities

## Future Enhancements

- Offline support with bet queue
- Pull-to-refresh on HomeScreen
- Search functionality for markets
- Error toast component (replace Alert.alert)
- Profile editing UI
- Transaction history screen
- Username uniqueness validation
- Friend code lookup and referral bonuses
