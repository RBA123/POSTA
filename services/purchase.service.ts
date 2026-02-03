import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import {
  CreditPackageId,
  PurchaseResult,
  OfferingsResult,
} from "../types/purchase";

/**
 * Purchase Service
 *
 * Handles all In-App Purchase logic using RevenueCat SDK
 */

class PurchaseService {
  /**
   * Set the user ID for RevenueCat (call after authentication)
   */
  async loginUser(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log("✅ User logged into RevenueCat:", userId);
    } catch (error) {
      console.error("❌ Error logging in user to RevenueCat:", error);
      throw error;
    }
  }

  /**
   * Log out the current user from RevenueCat
   */
  async logoutUser(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log("✅ User logged out from RevenueCat");
    } catch (error) {
      console.error("❌ Error logging out user from RevenueCat:", error);
      throw error;
    }
  }

  /**
   * Fetch available offerings from RevenueCat
   */
  async getOfferings(): Promise<OfferingsResult> {
    try {
      const offerings = await Purchases.getOfferings();

      console.log("📦 Offerings fetched:", {
        current: offerings.current?.identifier,
        all: Object.keys(offerings.all),
      });

      return {
        currentOffering: offerings.current,
        allOfferings: offerings.all,
      };
    } catch (error) {
      console.error("❌ Error fetching offerings:", error);
      throw error;
    }
  }

  /**
   * Purchase a credit package
   */
  async purchasePackage(rcPackage: PurchasesPackage): Promise<PurchaseResult> {
    try {
      console.log("💳 Initiating purchase:", rcPackage.identifier);

      const { customerInfo } = await Purchases.purchasePackage(rcPackage);

      console.log("✅ Purchase successful:", {
        packageId: rcPackage.identifier,
        customerInfo: customerInfo.originalAppUserId,
      });

      // The webhook will handle updating the balance
      // Return success immediately
      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);

      // Handle user cancellation gracefully
      if (error.userCancelled) {
        return {
          success: false,
          error: "Purchase cancelled",
        };
      }

      return {
        success: false,
        error: error.message || "Purchase failed",
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      console.log("🔄 Restoring purchases...");

      const customerInfo = await Purchases.restorePurchases();

      console.log("✅ Purchases restored:", {
        userId: customerInfo.originalAppUserId,
      });

      return {
        success: true,
        customerInfo,
      };
    } catch (error: any) {
      console.error("❌ Failed to restore purchases:", error);
      return {
        success: false,
        error: error.message || "Failed to restore purchases",
      };
    }
  }

  /**
   * Get current customer info (includes purchase history)
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error("❌ Error fetching customer info:", error);
      throw error;
    }
  }

  /**
   * Check if user has any active entitlements (for subscriptions)
   * Note: This app uses consumable credits, not subscriptions
   */
  async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error("❌ Error checking entitlement:", error);
      return false;
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();
