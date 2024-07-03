import {
  NEW_ACTIVITIES_CHANNEL_ID,
  NEW_COMMENTS_CHANNEL_ID,
  NEW_CONNECTIONS_CHANNEL_ID,
  NEW_LIKES_CHANNEL_ID,
  REST_TIMER_CHANNEL_ID,
} from "app/data/constants"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import * as Notifications from "expo-notifications"
import React, { useEffect } from "react"
import { Alert, Linking, Platform } from "react-native"

export const useNotification = () => {
  const { themeStore, userStore } = useStores()
  const notificationListener = React.useRef<Notifications.Subscription>()
  const responseListener = React.useRef<Notifications.Subscription>()

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== "granted") {
      Alert.alert(
        translate("notification.permissionAlert.title"),
        translate("notification.permissionAlert.message"),
        [
          {
            text: translate("notification.permissionAlert.goToAppSettingsButtonLabel"),
            style: "default",
            onPress: () => {
              Linking.openSettings()
            },
          },
          {
            text: translate("common.ok"),
            style: "cancel",
            onPress: () => {},
          },
        ],
      )
    }
  }

  const registerAndroidNotificationChannels = async () => {
    if (Platform.OS === "android") {
      // Android remembers settings for each channel, even after the channel is deleted
      // To apply changes, the only way is to get the previous settings, update and apply them to a new channel
      // See: https://stackoverflow.com/a/60203498
      await Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
        importance: Notifications.AndroidImportance.MAX,
        name: translate("notification.restTime.channelName"),
        sound: "rest_time_notification.wav",
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
      await Notifications.setNotificationChannelAsync(NEW_ACTIVITIES_CHANNEL_ID, {
        importance: Notifications.AndroidImportance.HIGH,
        name: translate("notification.newActivities.channelName"),
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
      await Notifications.setNotificationChannelAsync(NEW_CONNECTIONS_CHANNEL_ID, {
        importance: Notifications.AndroidImportance.HIGH,
        name: translate("notification.newConnections.channelName"),
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
      await Notifications.setNotificationChannelAsync(NEW_COMMENTS_CHANNEL_ID, {
        importance: Notifications.AndroidImportance.HIGH,
        name: translate("notification.newComments.channelName"),
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
      await Notifications.setNotificationChannelAsync(NEW_LIKES_CHANNEL_ID, {
        importance: Notifications.AndroidImportance.HIGH,
        name: translate("notification.newLikes.channelName"),
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
    }
  }

  useEffect(() => {
    requestNotificationPermissions()
    registerAndroidNotificationChannels()

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.debug("useNotification notificationListener:", notification)
      // TODO: Maybe show a toast in app
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.debug("useNotification responseListener:", response)
      const data = response?.notification?.request?.content?.data
      const notificationId = data?.notificationId
      if (!notificationId) return

      userStore.markNotificationAsRead(notificationId)
      Notifications.getBadgeCountAsync().then((badgeCount) => {
        Notifications.setBadgeCountAsync(Math.max(badgeCount - 1, 0))
      })
    })

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current!)
    }
  }, [])
}
