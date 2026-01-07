/**
 * useNotifications Hook
 * 
 * Manages user notifications with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import {
  getUserNotificationsList,
  subscribeToNotificationsList,
  markNotificationAsRead,
  getUnreadCount,
} from "../services/notification.service";
import type { UserNotification } from "../firebase/types/firestore.types";

interface UseNotificationsReturn {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(
  userId: string | null,
  realTime: boolean = true
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Update unread count
  const updateUnreadCount = useCallback((notifs: UserNotification[]) => {
    const unread = notifs.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const fetchedNotifications = await getUserNotificationsList(userId, 100);
      setNotifications(fetchedNotifications);
      updateUnreadCount(fetchedNotifications);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [userId, updateUnreadCount]);

  // Subscribe to real-time updates or fetch once
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (realTime) {
      setLoading(true);
      setError(null);

      // Subscribe to real-time updates
      const unsubscribe = subscribeToNotificationsList(
        userId,
        (updatedNotifications) => {
          setNotifications(updatedNotifications);
          updateUnreadCount(updatedNotifications);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Fetch once
      fetchNotifications();
    }
  }, [userId, realTime, fetchNotifications, updateUnreadCount]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        setError(null);
        await markNotificationAsRead(notificationId);
        // Notifications will update automatically via subscription
      } catch (err: any) {
        setError(err);
        throw err;
      }
    },
    []
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    refreshNotifications: fetchNotifications,
  };
}

