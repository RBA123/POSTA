# Firebase Setup Instructions

## ✅ Completed Steps

1. ✅ Installed Firebase packages (`@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`)
2. ✅ Installed `expo-build-properties` plugin
3. ✅ Updated `app.json` with Firebase plugins and config paths
4. ✅ Created `lib/firebase.ts` with Firebase initialization

## ⚠️ Action Required: Download Firebase Config Files

Before rebuilding the app, you need to download the actual Firebase configuration files:

### For iOS (GoogleService-Info.plist):

1. Go to: https://console.firebase.google.com/project/liberta-main/settings/general
2. Scroll down to the "Your apps" section
3. Find your iOS app (or create one if it doesn't exist)
4. Click "Download GoogleService-Info.plist"
5. Replace the placeholder file at: `GoogleService-Info.plist` in the project root

### For Android (google-services.json):

1. Go to: https://console.firebase.google.com/project/liberta-main/settings/general
2. Scroll down to the "Your apps" section
3. Find your Android app (or create one if it doesn't exist)
4. Click "Download google-services.json"
5. Replace the placeholder file at: `google-services.json` in the project root

## Next Steps

After downloading the config files:

1. **Rebuild native projects:**

   ```bash
   npx expo prebuild --clean
   ```

2. **Run on iOS:**

   ```bash
   npx expo run:ios
   ```

3. **Or run on Android:**
   ```bash
   npx expo run:android
   ```

## Testing Firebase Connection

To verify Firebase is connected, you can temporarily add this to `App.tsx`:

```typescript
import { firebase } from "./lib/firebase";

useEffect(() => {
  console.log("Firebase App Name:", firebase.app().name);
  console.log("Firebase initialized successfully!");
}, []);
```

Remove this test code after verifying the connection works.

## Using Firebase Later

When you're ready to implement authentication and storage:

```typescript
// Authentication
import { auth } from "./lib/firebase";
await auth().createUserWithEmailAndPassword(email, password);
await auth().signInWithEmailAndPassword(email, password);

// Firestore
import { firestore } from "./lib/firebase";
await firestore().collection("users").doc(userId).set(data);
const snapshot = await firestore().collection("users").doc(userId).get();
```
