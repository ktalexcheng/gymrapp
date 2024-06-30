import { logError } from "app/utils/logger"
import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"

// See: https://docs.expo.dev/versions/latest/sdk/notifications/#handling-notification-channels
// The token is only required for push notifications, not for local notifications
// and is specific to each device, re-installs/updates do not change tokens on iOS, but changes on Android
export const getExpoDevicePushToken = async () => {
  if (Device.isDevice) {
    try {
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) {
        throw new Error("Project ID not found")
      }

      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data

      console.debug("getDevicePushToken", { pushTokenString })
      return pushTokenString
    } catch (e) {
      logError(e, "Failed to register device for push notifications.")
    }
  } else {
    console.debug("Must use physical device for push notifications")
  }

  return null
}
