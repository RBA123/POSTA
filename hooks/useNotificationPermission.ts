/**
 * Hook to manage notification permission request for authenticated users
 * Only asks once, after user is logged in and on home screen
 */

import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { updateUserProfile, getUserProfile } from '../services/user.service';
import { Storage } from '../lib/storage';
import { getExpoPushToken, isPushNotificationSupported } from '../lib/expoPushToken';

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

        // Check if push notifications are supported
        // Note: iOS Expo Go supports push notifications, Android Expo Go does not
        // We still need a valid projectId for push notifications to work
        if (!isPushNotificationSupported()) {
          // Push notifications not supported (Android Expo Go or missing projectId)
          // Mark as asked so we don't prompt, but don't enable notifications
          await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
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
            const tokenData = await getExpoPushToken();
            await updateUserProfile(userId, {
              expoPushToken: tokenData.data,
              notificationsEnabled: true,
            });
          } catch (tokenError) {
            // Silently handle errors (e.g., Expo Go or missing projectId)
            const errorMessage = tokenError?.message || String(tokenError);
            if (!errorMessage.includes('not supported') && !errorMessage.includes('No valid Expo project ID')) {
              console.error('Error getting push token:', tokenError);
            }
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

    // Check if push notifications are supported
    // Note: We can still request permission even if projectId is missing
    // (user might add it later), but we can't get tokens without projectId
    const supported = isPushNotificationSupported();
    
    if (!supported) {
      // Android Expo Go doesn't support push notifications
      // Still mark as asked so we don't prompt again
      await Storage.setItem(NOTIFICATION_PERMISSION_ASKED_KEY, 'true');
      setHasAsked(true);
      
      // Update profile to reflect that notifications aren't supported
      await updateUserProfile(userId, {
        notificationsEnabled: false,
      });
      
      return false;
    }

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
          const tokenData = await getExpoPushToken();
          await updateUserProfile(userId, {
            expoPushToken: tokenData.data,
            notificationsEnabled: true,
          });
          console.log('✅ Notification permission granted and token stored');
        } catch (tokenError) {
          // Handle errors gracefully (e.g., Android Expo Go, missing projectId, or invalid UUID)
          const errorMessage = tokenError?.message || String(tokenError);
          if (
            !errorMessage.includes('not supported') && 
            !errorMessage.includes('No valid Expo project ID') &&
            !errorMessage.includes('Invalid uuid')
          ) {
            console.error('Error getting push token:', tokenError);
          }
          // Still enable notifications in profile even if token fails
          // (user can add projectId later and token will be retrieved on next app start)
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
