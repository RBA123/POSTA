# Firebase Setup Guide for Liberta

This guide will help you set up and deploy the Firebase backend for the Liberta betting platform.

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project created**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or use existing `liberta-main`

3. **Login to Firebase**
   ```bash
   firebase login
   ```

4. **Initialize Firebase in project**
   ```bash
   firebase use liberta-main
   ```

## Step 1: Install Dependencies

### Cloud Functions
```bash
cd firebase/functions
npm install
```

## Step 2: Deploy Firestore Rules and Indexes

```bash
# From project root
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Note:** Indexes may take a few minutes to build. Check Firebase Console > Firestore > Indexes for status.

## Step 3: Build and Deploy Cloud Functions

```bash
cd firebase/functions
npm run build
cd ../..
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:placeBet,functions:settleMarket
```

## Step 4: Seed Test Data

### Option A: Using Firebase Admin SDK (Recommended)

1. **Get Service Account Key**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. **Set Environment Variable**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
   ```

3. **Run Seed Script**
   ```bash
   # Install ts-node if not already installed
   npm install -g ts-node
   
   # Run seed script
   npx ts-node firebase/scripts/seedData.ts
   ```

### Option B: Using Firebase Console

Manually create test data in Firebase Console:
- Create a user document in `users` collection
- Create markets in `markets` collection
- Set `isAdmin: true` for at least one user

## Step 5: Configure Authentication

The app uses Firebase Authentication with email/password. Ensure it's enabled:

1. Go to Firebase Console > Authentication > Sign-in method
2. Enable "Email/Password"
3. Optionally enable other providers (Google, Apple, etc.)

## Step 6: Test the Setup

### Using Firebase Emulator (Local Development)

```bash
# Start emulators
firebase emulators:start

# In another terminal, run your app
npm start
```

### Testing Cloud Functions Locally

```bash
cd firebase/functions
npm run serve
```

## Common Issues

### Issue: "Index not found" errors
**Solution:** Wait for indexes to build, or create them manually in Firebase Console

### Issue: "Permission denied" errors
**Solution:** 
- Check security rules are deployed: `firebase deploy --only firestore:rules`
- Verify user is authenticated
- Check user document has correct `isAdmin` flag

### Issue: Functions won't deploy
**Solution:**
- Check Node.js version matches `package.json` engines (Node 18)
- Ensure all dependencies are installed
- Check Firebase CLI is logged in: `firebase login`

### Issue: TypeScript errors in functions
**Solution:**
- Run `npm run build` in `firebase/functions` directory
- Check `tsconfig.json` is correct
- Ensure all imports are correct

## Next Steps

1. **Set up Authentication Flow**
   - Update `SignupScreen.tsx` to create user in Firestore after Firebase Auth signup
   - Update `WelcomeScreen.tsx` to handle login

2. **Test Bet Placement**
   - Use test user account
   - Place bets on test markets
   - Verify balances update correctly

3. **Set up Admin Panel** (Optional)
   - Create admin interface for market management
   - Use `createMarket` Cloud Function
   - Use `settleMarket` Cloud Function

4. **Configure Push Notifications** (Future)
   - Set up FCM tokens in user documents
   - Enable push notifications in `sendPushNotification.ts`

## Monitoring

View function logs:
```bash
firebase functions:log
```

View specific function:
```bash
firebase functions:log --only placeBet
```

View Firestore usage:
- Firebase Console > Firestore > Usage

## Security Checklist

- [ ] Security rules deployed
- [ ] Indexes created
- [ ] Cloud Functions deployed
- [ ] Admin users configured
- [ ] Authentication enabled
- [ ] Test data seeded
- [ ] Error handling tested

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review Cloud Functions logs
3. Check Firestore security rules
4. Verify indexes are built

