/**
 * Notification Service
 * 
 * User notifications management
 */

import {
  getUserNotifications,
  subscribeToUserNotifications,
} from "../lib/firestore";
import { markNotificationRead as markReadFunction } from "../lib/functions";
import type { UserNotification } from "../firebase/types/firestore.types";

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

/**
 * Get user notifications
 */
export async function getUserNotificationsList(
  userId: string,
  limit: number = 50
): Promise<UserNotification[]> {
  try {
    return await getUserNotifications(userId, limit);
  } catch (error: any) {
    throw new Error("Error al obtener las notificaciones.");
  }
}

/**
 * Subscribe to user notifications with real-time updates
 * Returns unsubscribe function
 */
export function subscribeToNotificationsList(
  userId: string,
  callback: (notifications: UserNotification[]) => void
) {
  try {
    return subscribeToUserNotifications(userId, callback);
  } catch (error: any) {
    throw new Error("Error al suscribirse a las notificaciones.");
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  try {
    await markReadFunction(notificationId);
  } catch (error: any) {
    throw new Error(
      error.message || "Error al marcar la notificación como leída."
    );
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const notifications = await getUserNotifications(userId, 1000); // Get all
    return notifications.filter((n) => !n.read).length;
  } catch (error: any) {
    return 0;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  userId: string
): Promise<void> {
  try {
    const notifications = await getUserNotifications(userId, 1000);
    const unreadNotifications = notifications.filter((n) => !n.read);

    // Mark each unread notification as read
    await Promise.all(
      unreadNotifications.map((notification) =>
        markNotificationAsRead(notification.id)
      )
    );
  } catch (error: any) {
    throw new Error("Error al marcar todas las notificaciones como leídas.");
  }
}

