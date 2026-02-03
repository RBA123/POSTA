# Liberta - Admin Tool Plan

## Purpose

The admin tool will be a web-based dashboard that allows administrators to create and manage real-time betting markets, set market opening times, settle markets, and monitor betting activity.

## Required Features

### 1. Market Management

#### Create Markets
- **Form Fields**:
  - Market question (required)
  - Description (optional)
  - Category selection (en_vivo, partidos, torneos, fase_grupos, jugadores)
  - Open time (when market becomes available for betting)
  - Lock time (for EN VIVO markets - when betting closes)
  - Urgent flag (for EN VIVO markets)
  - Tags (optional, for filtering)
  - Image URL (optional)

- **Behavior**:
  - If open time is in the past or now, market status = "open"
  - If open time is in the future, market status = "draft"
  - Initial odds set to 50/50
  - Initial volume and stats set to 0

#### View Markets
- List all markets with filtering options:
  - By category
  - By status (draft, open, locked, settled, cancelled)
  - By date range
- Display market details:
  - Question, category, status
  - Current odds (siProbability, noProbability)
  - Volume statistics (totalVolume, siVolume, noVolume)
  - Bet counts (totalBets, uniqueBettors)
  - Timing (openAt, lockAt, settledAt)
  - Result (if settled)

#### Edit Markets
- Update market question, description, tags
- Change market status (draft ↔ open)
- Update open time and lock time
- Modify urgent flag

#### Settle Markets
- Select market result: "Sí", "No", or "Cancelled"
- Preview affected bets and users
- Confirm settlement
- System automatically:
  - Updates all bet statuses
  - Distributes winnings or refunds
  - Updates user balances
  - Creates transaction records
  - Updates user statistics

### 2. Market Statistics

#### Market Dashboard
- View market performance metrics:
  - Total volume
  - Number of bets
  - Unique bettors
  - Current odds distribution
  - Bet breakdown by side (Sí vs No)

#### Bet Leaderboard
- View top bettors for a market
- Display bet amounts and potential winnings
- Filter by side (Sí or No)

### 3. User Management

#### View Users
- List all users with filtering:
  - By country
  - By registration date
  - By balance range
- Display user statistics:
  - Total positions
  - Win rate
  - Total winnings/losses
  - Active positions

#### User Actions
- View user profile details
- View user bet history
- View user transaction history
- (Future) Adjust user balance (with audit trail)

### 4. System Monitoring

#### Real-Time Activity
- Monitor active markets
- Track bet placement in real-time
- View system health metrics

#### Notifications
- Send custom notifications to users
- Send promotional notifications
- View notification history

## Technology Stack (Suggested)

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Firebase Admin SDK** - Backend access
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching

### Backend
- **Firebase Admin SDK** - Direct Firestore access
- **Existing Cloud Functions** - Reuse `createMarket`, `settleMarket`, etc.
- **Firebase Authentication** - Admin login

### Deployment
- **Firebase Hosting** - Static site hosting
- **Firebase Authentication** - Admin authentication
- **Custom Domain** - Secure admin access

## Security

### Authentication
- Admin-only access using Firebase Authentication
- Verify `isAdmin: true` flag in user document
- Secure admin login page

### Authorization
- All operations verify admin status
- Use Firebase Admin SDK for server-side operations
- Client-side calls use existing Cloud Functions (which verify admin status)

### Access Control
- Restrict admin tool access to specific IPs (optional)
- Require 2FA for admin accounts (future)
- Audit log for all admin actions (future)

## Implementation Plan

### Phase 1: Basic Market Management
1. Set up React project with Firebase Admin SDK
2. Create admin authentication flow
3. Implement market creation form
4. Implement market list view
5. Integrate with existing `createMarket` Cloud Function

### Phase 2: Market Settlement
1. Implement market settlement UI
2. Integrate with existing `settleMarket` Cloud Function
3. Add settlement confirmation and preview
4. Display settlement results

### Phase 3: Market Editing & Management
1. Implement market edit functionality
2. Add market status management
3. Add market filtering and search
4. Display market statistics

### Phase 4: User Management
1. Implement user list view
2. Add user filtering and search
3. Display user statistics and history
4. (Future) User balance adjustment

### Phase 5: Advanced Features
1. Real-time activity monitoring
2. Custom notification sending
3. Analytics dashboard
4. Audit logging

## Database Access

The admin tool will use:
- **Firebase Admin SDK** for direct Firestore access (bypasses security rules)
- **Existing Cloud Functions** for operations that modify data (ensures consistency)

## Key Considerations

1. **Data Consistency**: Use Cloud Functions for all write operations to ensure data integrity
2. **Real-Time Updates**: Use Firestore listeners for live market and bet updates
3. **Error Handling**: Comprehensive error handling for all operations
4. **User Experience**: Intuitive UI for non-technical admins
5. **Performance**: Efficient queries with proper indexes
6. **Mobile Responsive**: Admin tool should work on tablets/mobile devices

## Next Steps

1. Set up React project structure
2. Configure Firebase Admin SDK
3. Implement authentication flow
4. Build market creation form
5. Integrate with existing Cloud Functions
6. Deploy to Firebase Hosting

## Future Enhancements

- Automated market creation from external data sources
- Market templates for common market types
- Bulk market operations
- Advanced analytics and reporting
- Market result verification system
- Integration with sports data APIs
- Automated market settlement based on external results
