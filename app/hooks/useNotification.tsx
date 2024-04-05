import { translate } from "app/i18n"
import { useStores } from "app/stores"
import * as Notifications from "expo-notifications"
import { useEffect } from "react"
import { Alert, Linking, Platform } from "react-native"
import { REST_TIMER_CHANNEL_ID } from "../data/constants"

export const useNotification = () => {
  const { themeStore } = useStores()
  // const notificationListener = useRef<Notifications.Subscription>()
  // const responseListener = useRef<Notifications.Subscription>()

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
      await Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
        name: translate("notification.restTime.channelName"),
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: themeStore.colors("actionable"),
      })
    }
  }

  // // See: https://docs.expo.dev/versions/latest/sdk/notifications/#handling-notification-channels
  // // The token is only required for push notifications, not for local notifications
  // const registerForPushNotifications = async () => {
  //   // Learn more about projectId:
  //   // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  //   const token = (
  //     await Notifications.getExpoPushTokenAsync({
  //       projectId: Constants.expoConfig.extra.eas.projectId,
  //     })
  //   ).data
  //   return token
  // }

  useEffect(() => {
    requestNotificationPermissions()
    registerAndroidNotificationChannels()
    // registerForPushNotifications()

    // notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    //   console.debug("useNotification notificationListener:", notification)
    // })

    // responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    //   console.debug("useNotification responseListener:", response)
    // })

    // return () => {
    //   Notifications.removeNotificationSubscription(notificationListener.current!)
    //   Notifications.removeNotificationSubscription(responseListener.current!)
    // }
  }, [])
}
