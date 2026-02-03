import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export bet functions
export { placeBet } from "./bets/placeBet";
export { settleMarket } from "./bets/settleBets";

// Export market functions
export { updateMarketOdds, recalculateMarketOdds } from "./markets/updateOdds";
export { scheduledMarketStatus, createMarket } from "./markets/marketScheduler";
export { deleteMarket } from "./markets/deleteMarket";

// Export notification functions
export {
  sendMarketOpenNotification,
  sendCustomNotification,
  markNotificationRead,
} from "./notifications/sendPushNotification";

// Export payment functions
export { revenueCatWebhook } from "./payments/revenuecatWebhook";
