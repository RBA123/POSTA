# Future Changes

## RevenueCat IAP Integration

**Status:** Removed (not in use) — can be re-added when needed.

### What It Was

RevenueCat managed in-app purchases (IAP) through the App Store and Google Play Store, allowing users to buy virtual credit packages with real money.

### Credit Packages (previously configured)

| Product ID       | Credits | Price  | Cents Added |
|------------------|---------|--------|-------------|
| `credits_100`    | 100     | $4.99  | 10,000      |
| `credits_500`    | 500     | $19.99 | 50,000      |
| `credits_1000`   | 1,000   | $34.99 | 100,000     |
| `credits_2500`   | 2,500   | $79.99 | 250,000     |

### What Was Removed

- **Client SDK:** `react-native-purchases` and `react-native-purchases-ui` npm packages
- **Client service:** `services/purchase.service.ts` — singleton wrapper around RevenueCat SDK (login, logout, getOfferings, purchasePackage, restorePurchases)
- **Client types:** `types/purchase.ts` — `CreditPackageId` enum, `PurchaseResult`, `OfferingsResult`, `CreditPackDisplay` interfaces
- **Backend webhook:** `firebase/functions/src/payments/revenuecatWebhook.ts` — HTTPS webhook handler that verified HMAC signatures and credited user balances atomically
- **Setup guide:** `docs/iap-setup.md` — full RevenueCat configuration instructions
- **App.tsx:** RevenueCat initialization `useEffect` (configured SDK with platform-specific API keys)
- **AuthContext.tsx:** RevenueCat login/logout calls during auth state changes
- **PaymentMethodsScreen.tsx:** Full credit pack purchase UI (replaced with placeholder)
- **Environment variables:** `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- **Firebase secret:** `REVENUECAT_WEBHOOK_SECRET` (was never actually configured, causing deploy failures)

### Why It Was Removed

The webhook secret was never configured in Firebase Secret Manager, which caused Cloud Functions deployment failures. The app uses dLocal for real-money payments instead. RevenueCat can be re-integrated in the future if IAP credit purchasing is needed.

### How to Re-Add

1. Install `react-native-purchases` and optionally `react-native-purchases-ui`
2. Create a RevenueCat account and configure App Store/Play Store products
3. Re-implement the purchase service singleton (see git history for reference)
4. Add webhook handler with HMAC verification
5. Set `REVENUECAT_WEBHOOK_SECRET` in Firebase Secret Manager
6. Add RevenueCat API keys to `.env`
7. Initialize SDK in `App.tsx` and add login/logout to `AuthContext.tsx`
