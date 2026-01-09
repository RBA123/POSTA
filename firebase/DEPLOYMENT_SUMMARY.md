# 🚀 Firebase Deployment Summary - Liberta

**Project:** `liberta-main`  
**Date:** January 7, 2026  
**Status:** ✅ **FULLY DEPLOYED**

---

## ✅ Deployed Components

### 1. Firestore Security Rules
- **Status:** ✅ Deployed
- **File:** `firebase/firestore.rules`
- **Features:**
  - User data protection (users can only read/update their own data)
  - Public market reads, admin-only writes
  - Cloud Functions-only bet/transaction writes
  - Admin permission checks

### 2. Firestore Indexes
- **Status:** ✅ Deployed
- **File:** `firebase/firestore.indexes.json`
- **Indexes Created:**
  - Markets by category + status + openAt
  - Markets by status + isUrgent + lockAt
  - User bets by userId + status + placedAt
  - User bets by userId + placedAt
  - User bets by marketId + status + placedAt
  - Transactions by userId + createdAt
  - Transactions by userId + type + createdAt
  - Notifications by read + createdAt (collection group)
  - Markets by category + isUrgent + openAt

### 3. Cloud Functions (Node.js 20)
- **Region:** `us-central1`
- **Runtime:** Node.js 20 (1st Gen)
- **Total Functions:** 9

#### Deployed Functions:

| Function | Type | Trigger | Purpose |
|----------|------|---------|---------|
| `placeBet` | Callable | HTTPS | Place a bet on a market |
| `settleMarket` | Callable | HTTPS | Settle a market and resolve bets (admin only) |
| `updateMarketOdds` | Firestore Trigger | Document Create | Auto-update odds when bets are placed |
| `recalculateMarketOdds` | Callable | HTTPS | Manually recalculate market odds |
| `scheduledMarketStatus` | Scheduled | Every 1 minute | Lock expired EN VIVO markets |
| `createMarket` | Callable | HTTPS | Create new market (admin only) |
| `sendMarketOpenNotification` | Firestore Trigger | Document Update | Send notifications when markets open |
| `sendCustomNotification` | Callable | HTTPS | Send custom notification |
| `markNotificationRead` | Callable | HTTPS | Mark notification as read |

---

## 🗄️ Firestore Database Structure

### Collections:
- **`users`** - User profiles and account data
- **`markets`** - Betting markets/questions
- **`userBets`** - User-centric bet records
- **`transactions`** - Financial transaction history

### Subcollections:
- **`users/{userId}/notifications`** - User notifications
- **`users/{userId}/paymentMethods`** - Saved payment methods
- **`users/{userId}/settings`** - User preferences
- **`markets/{marketId}/bets`** - Market-level bet aggregation

---

## 📊 Configuration Details

### Firebase Project
- **Project ID:** `liberta-main`
- **Project Number:** 446575654136
- **Firestore Region:** `us-central1`
- **Firestore Database:** `(default)`
- **App Engine Region:** (configured for Cloud Functions)

### Billing
- **Plan:** Blaze (Pay-as-you-go)
- **Free Tier Includes:**
  - 2M Cloud Functions invocations/month
  - 50K document reads/day
  - 20K document writes/day
  - 20K document deletes/day
  - 1GB storage

---

## 🧪 Testing the Deployment

### 1. Test Firestore Access
Open Firebase Console and verify:
```
https://console.firebase.google.com/project/liberta-main/firestore
```

### 2. Test Cloud Functions
View function logs:
```bash
firebase functions:log
```

View specific function:
```bash
firebase functions:log --only placeBet
```

### 3. Seed Test Data
Run the seed script to populate test data:
```bash
npx ts-node firebase/scripts/seedData.ts
```

This will create:
- Test admin user (admin@liberta.com)
- Test regular user (user@liberta.com)
- 15 test markets across all categories

---

## 🔗 Important Links

- **Firebase Console:** https://console.firebase.google.com/project/liberta-main
- **Firestore Database:** https://console.firebase.google.com/project/liberta-main/firestore
- **Cloud Functions:** https://console.firebase.google.com/project/liberta-main/functions
- **Authentication:** https://console.firebase.google.com/project/liberta-main/authentication
- **Usage & Billing:** https://console.firebase.google.com/project/liberta-main/usage

---

## 📱 Next Steps

### 1. Enable Authentication
Go to Firebase Console > Authentication > Sign-in method
- Enable "Email/Password" provider
- Configure authorized domains

### 2. Seed Test Data
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
npx ts-node firebase/scripts/seedData.ts
```

### 3. Update App Screens
The following screens are already updated to use Firestore:
- ✅ `HomeScreen.tsx` - Real-time market subscriptions
- ✅ `ActivityScreen.tsx` - Real-time bet tracking
- ✅ `ProfileScreen.tsx` - User profile and stats
- ✅ `NotificationsHistoryScreen.tsx` - Notifications

### 4. Implement Authentication Flow
Update these screens to integrate Firebase Auth:
- `SignupScreen.tsx` - Create Firestore user after signup
- `WelcomeScreen.tsx` - Handle login flow

### 5. Test Bet Placement
1. Sign up a test user
2. Navigate to a market
3. Place a bet
4. Verify balance updates
5. Check bet appears in Activity screen

---

## 🔒 Security Notes

- ✅ Security rules prevent unauthorized data access
- ✅ Bets can only be placed via Cloud Functions (prevents cheating)
- ✅ Admin functions require `isAdmin: true` in user document
- ✅ User balances can only be modified by Cloud Functions
- ⚠️ Remember to never expose Firebase Admin credentials in client code

---

## 🐛 Troubleshooting

### Functions not working?
```bash
firebase functions:log --only functionName
```

### Permission errors?
Check security rules are deployed:
```bash
firebase deploy --only firestore:rules
```

### Index errors?
Indexes take a few minutes to build. Check status:
```
https://console.firebase.google.com/project/liberta-main/firestore/indexes
```

### Need to redeploy?
```bash
firebase deploy --only functions:placeBet  # Single function
firebase deploy --only functions           # All functions
firebase deploy                            # Everything
```

---

## 📞 Support

For Firebase issues:
- Firebase Docs: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support

For Liberta-specific issues:
- Check function logs: `firebase functions:log`
- Check Firestore rules in console
- Verify indexes are built

---

**Deployment completed successfully! 🎉**

