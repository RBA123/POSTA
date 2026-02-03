# In-App Purchases Implementation Guide

This guide explains how to complete the In-App Purchase (IAP) implementation using RevenueCat for purchasing virtual credits.

## ✅ What's Been Implemented

1. **RevenueCat SDK Integration**
   - Added `react-native-purchases` and `react-native-purchases-ui` dependencies
   - Initialized SDK in [App.tsx](App.tsx) with environment variable support
   - Created TypeScript types in [types/purchase.ts](types/purchase.ts)

2. **Backend Payment Processing**
   - Created Cloud Function `revenueCatWebhook` in [firebase/functions/src/payments/revenuecatWebhook.ts](firebase/functions/src/payments/revenuecatWebhook.ts)
   - Handles purchase validation and credit deposits automatically
   - Records transactions with idempotency protection

3. **Purchase Service Layer**
   - Created [services/purchase.service.ts](services/purchase.service.ts)
   - Handles: fetch offerings, purchase packages, restore purchases, customer info

4. **UI Updates**
   - Updated [PaymentMethodsScreen.tsx](screens/PaymentMethodsScreen.tsx) with credit pack offerings
   - Added "Buy Credits" button to [ProfileScreen.tsx](screens/ProfileScreen.tsx)
   - Shows balance prominently with purchase flow

## 🚀 Next Steps to Complete

### 1. Install Dependencies

```bash
cd /Users/gabrielcastillo/Developer/AppDevelopment/Porta
npm install
```

### 2. Set Up RevenueCat Account

1. Sign up at [app.revenuecat.com](https://app.revenuecat.com)
2. Create a new project
3. Connect your App Store Connect and Google Play Console accounts
4. Get your API keys from Settings → API Keys

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your RevenueCat API keys:

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxxx
```

### 4. Create IAP Products

#### In App Store Connect (iOS):

1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create 4 **Consumable** products:
   - `credits_100` - $4.99 - "100 Credits"
   - `credits_500` - $19.99 - "500 Credits"
   - `credits_1000` - $34.99 - "1000 Credits"
   - `credits_2500` - $79.99 - "2500 Credits"

#### In Google Play Console (Android):

1. Go to Google Play Console → Your App → Monetize → In-app products
2. Create the same 4 products with matching IDs

### 5. Configure Products in RevenueCat

1. Go to RevenueCat Dashboard → Products
2. Add all 4 products (RevenueCat will import from stores)
3. Create an **Offering** called "Credits" (or "default")
4. Add all packages to the offering
5. Make it the current offering

### 6. Set Up RevenueCat Webhook

1. Deploy your Cloud Functions:

   ```bash
   cd firebase/functions
   npm install
   npm run deploy
   ```

2. In RevenueCat Dashboard → Integrations → Webhooks:
   - URL: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/revenueCatWebhook`
   - Authorization: (Optional - add a secret if needed)
   - Events: Check `INITIAL_PURCHASE` and `NON_RENEWING_PURCHASE`

### 7. Update User Login Flow

Add this to [contexts/AuthContext.tsx](contexts/AuthContext.tsx) in the login/signup success handler:

```typescript
import { purchaseService } from "../services/purchase.service";

// After successful login/signup:
await purchaseService.loginUser(user.uid);
```

Add this to the logout handler:

```typescript
// Before clearing auth:
await purchaseService.logoutUser();
```

### 8. Build Development Client

Since RevenueCat requires native code, you need a development build:

```bash
# For iOS Simulator
eas build --platform ios --profile ios-simulator

# For Android Device/Emulator
eas build --platform android --profile development
```

After the build completes, install it on your device/simulator.

### 9. Test Purchases

#### iOS:

1. Create a Sandbox Tester in App Store Connect → Users and Access → Sandbox Testers
2. Sign out of your Apple ID in Settings → App Store
3. Run your app and make a test purchase
4. Sign in with sandbox tester when prompted

#### Android:

1. Add your Google account as a License Tester in Google Play Console
2. Install the app from the internal test track
3. Make a test purchase

### 10. Monitor in RevenueCat Dashboard

After making test purchases, check:

- RevenueCat Dashboard → Customers → See the purchase
- Firebase Console → Firestore → users/{uid}/transactions → See the transaction
- Check user's `virtualBalance` updated correctly

## 📋 Product Configuration Reference

| Product ID     | Credits | Price  | Bonus % | Description    |
| -------------- | ------- | ------ | ------- | -------------- |
| `credits_100`  | 100     | $4.99  | 0%      | Starter pack   |
| `credits_500`  | 500     | $19.99 | 25%     | Popular choice |
| `credits_1000` | 1000    | $34.99 | 40%     | Best value     |
| `credits_2500` | 2500    | $79.99 | 50%     | Ultimate pack  |

## 🔒 Important Notes

### Legal & Compliance

- **Gambling Laws**: Real-money betting apps may require gambling licenses in many jurisdictions
- **Age Verification**: Implement 18+ or 21+ age gates if required
- **Terms of Service**: Update to mention virtual credits are non-refundable and cannot be withdrawn
- **Responsible Gaming**: Consider limits and self-exclusion features

### Technical Notes

- Credits are **consumable** products (one-time purchase, can buy multiple times)
- Purchases are validated server-side via webhook (secure)
- Balance updates happen automatically when webhook receives confirmation
- Transactions are idempotent (duplicate webhooks won't double-credit)
- The app gracefully handles offline purchases (will sync when webhook fires)

## 🐛 Troubleshooting

### No Offerings Available

- Ensure products are created in App Store Connect & Google Play
- Check products are added to RevenueCat and linked to an offering
- Make sure offering is set as "current"
- Wait 24-48 hours for App Store to process new products

### Purchase Not Updating Balance

- Check Cloud Function logs in Firebase Console
- Verify webhook is configured correctly in RevenueCat
- Check webhook delivery logs in RevenueCat Dashboard
- Ensure transaction ID matches in logs

### "Invalid Product ID" Error

- Product IDs must exactly match across App Store Connect, Google Play, and your code
- Check `types/purchase.ts` matches your store products
- Rebuild the app after changing product IDs

## 📚 Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Apple In-App Purchase Guidelines](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)

## 🎯 Optional Enhancements

Consider adding these features later:

1. **Promotional offers** - First-time purchase bonus
2. **Referral bonuses** - Credit rewards for inviting friends
3. **Daily login rewards** - Free credits for engagement
4. **Achievement system** - Earn credits through gameplay
5. **Purchase history** - View all past transactions
6. **Spending analytics** - Track where credits are used
