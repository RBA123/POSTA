/**
 * Hook to manage notification permission request for authenticated users
 * Only asks once, after user is logged in and on home screen
 */

import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { updateUserProfile, getUserProfile } from '../services/user.service';
import { Storage } from '../lib/storage';

const NOTIFICATION_PERMISSION_ASKED_KEY = 'notification_permission_asked';

/**
 * Hook to check and request notification permissions for authenticated users
 * Returns whether permission has been requested/asked
 */
export function useNotificationPermission(userId: string | null) {
  const [hasAsked, setHasAsked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasAsked(null);
      return;
    }

    const checkPermissionStatus = async () => {
      try {
        // Check user profile first - if they already have notificationsEnabled set, don't ask
        try {
          const profile = await getUserProfile(userId);
          if (profile?.notificationsEnabled === true) {
            // User already has notifications enabled, mark as asked
            await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
            setHasAsked(true);
            return;
          }
        } catch (profileError) {
          // Profile might not exist yet, continue checking
          console.log('Profile not found or error loading:', profileError);
        }

        // Check if we've already asked this user
        const asked = await Storage.getItem(NOTIFICATION_PERMISSION_ASKED_KEY);
        if (asked === 'true') {
          setHasAsked(true);
          return;
        }

        // Check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        
        // If already granted, mark as asked and store token
        if (status === 'granted') {
          await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
          setHasAsked(true);
          
          // Store token if not already stored
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            await updateUserProfile(userId, {
              expoPushToken: tokenData.data,
              notificationsEnabled: true,
            });
          } catch (tokenError) {
            console.error('Error getting push token:', tokenError);
          }
          return;
        }

        // If denied, mark as asked (don't ask again)
        if (status === 'denied') {
          await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
          setHasAsked(true);
          return;
        }

        // If not determined, we haven't asked yet
        setHasAsked(false);
      } catch (error) {
        console.error('Error checking notification permission:', error);
        setHasAsked(true); // Don't ask if there's an error
      }
    };

    checkPermissionStatus();
  }, [userId]);

  const requestPermission = async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';

      // Mark as asked regardless of result
      await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
      setHasAsked(true);

      if (granted) {
        // Get and store push token
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          await updateUserProfile(userId, {
            expoPushToken: tokenData.data,
            notificationsEnabled: true,
          });
          console.log('✅ Notification permission granted and token stored');
        } catch (tokenError) {
          console.error('Error getting push token:', tokenError);
          // Still enable notifications even if token fails
          await updateUserProfile(userId, {
            notificationsEnabled: true,
          });
        }
      } else {
        // User denied - update profile to reflect this
        await updateUserProfile(userId, {
          notificationsEnabled: false,
        });
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
      setHasAsked(true);
      return false;
    }
  };

  const markAsAsked = async () => {
    // Mark as asked without requesting permission
    await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
    setHasAsked(true);
  };

  return {
    hasAsked,
    requestPermission,
    markAsAsked,
  };
}
