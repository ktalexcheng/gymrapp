import * as Notifications from "expo-notifications"
import { useEffect, useRef } from "react"

// See: https://docs.expo.dev/versions/latest/sdk/notifications/#handle-incoming-notifications-when-the-app-is
// This handles notifications received when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const useNotification = () => {
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.debug("useNotification notificationListener:", notification)
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.debug("useNotification responseListener:", response)
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current)
      Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])
}
