/**
 * Utility to get Expo project ID for push notifications
 * Tries to get from app config, handles invalid/missing projectId gracefully
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/**
 * Check if we're running in Expo Go
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Check if we're on Android
 */
function isAndroid(): boolean {
  return Constants.platform?.android !== undefined;
}

/**
 * Check if a string is a valid UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get the Expo project ID from config
 * Returns null if not found or invalid
 */
export function getExpoProjectId(): string | null {
  // Try to get from expo config
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.expoConfig?.extra?.projectId;

  // Check if projectId exists, is not empty, and is a valid UUID
  if (projectId && projectId.trim() !== '' && isValidUUID(projectId.trim())) {
    return projectId.trim();
  }

  return null;
}

/**
 * Check if push notifications are supported in the current environment
 * iOS Expo Go supports push notifications (on physical devices)
 * Android Expo Go does NOT support push notifications (SDK 53+)
 */
export function isPushNotificationSupported(): boolean {
  // Android Expo Go doesn't support push notifications (SDK 53+)
  if (isExpoGo() && isAndroid()) {
    return false;
  }

  // iOS Expo Go supports push notifications (on physical devices)
  // Development builds support push notifications on both platforms
  // We still need a valid projectId for push notifications to work
  return getExpoProjectId() !== null;
}

/**
 * Get Expo push token with proper projectId handling
 * Throws an error if projectId is invalid or if running on Android Expo Go
 */
export async function getExpoPushToken(): Promise<Notifications.ExpoPushToken> {
  // Check if we're on Android Expo Go (doesn't support push notifications)
  if (isExpoGo() && isAndroid()) {
    throw new Error(
      'Push notifications are not supported on Android Expo Go (SDK 53+). Please use a development build or test on iOS.'
    );
  }

  const projectId = getExpoProjectId();
  
  if (!projectId) {
    throw new Error(
      'No valid Expo project ID found. Please run "eas init" or "eas project:init" to configure your project. Push notifications will not work until a valid project ID is configured.'
    );
  }
  
  return await Notifications.getExpoPushTokenAsync({
    projectId,
  });
}
