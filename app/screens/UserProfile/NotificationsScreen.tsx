import { Avatar, Divider, Icon, RowView, Screen, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { FollowRequest, Notification, NotificationType, User } from "app/data/model"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, SectionList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

const FollowRequestTile = ({ followRequest }: { followRequest: FollowRequest }) => {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()
  const [isInitialized, setIsInitialized] = useState(false)
  const [senderUser, setSenderUser] = useState<User>(undefined)

  useEffect(() => {
    if (isInitialized) return

    userStore.getOtherUser(followRequest.requestedByUserId).then((senderUser) => {
      setSenderUser(senderUser)
      setIsInitialized(true)
    })
  }, [])

  const acceptFollowRequest = () => {
    userStore.acceptFollowRequest(followRequest.requestId)
  }

  const declineFollowRequest = () => {
    userStore.declineFollowRequest(followRequest.requestId)
  }

  if (!isInitialized) return null

  return (
    <TouchableOpacity
      onPress={() => mainNavigation.navigate("ProfileVisitorView", { userId: senderUser.userId })}
    >
      <RowView style={$notificationTileContainer}>
        <Avatar user={senderUser} />
        <View style={styles.flex1}>
          <Text style={$notificationText} weight="bold" text={senderUser.userHandle} />
          <Text
            style={$notificationText}
            text={formatName(senderUser.firstName, senderUser.lastName)}
          />
        </View>
        <RowView style={styles.alignCenter}>
          <Icon name="checkmark-circle" size={32} onPress={acceptFollowRequest} />
          <Icon name="close-outline" size={32} onPress={declineFollowRequest} />
        </RowView>
      </RowView>
    </TouchableOpacity>
  )
}

const NotificationTile = ({ notification }: { notification: Notification }) => {
  const mainNavigation = useMainNavigation()
  const [isInitialized, setIsInitialized] = useState(false)
  const { userStore } = useStores()
  const [senderUser, setSenderUser] = useState<User>(undefined)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!isInitialized) {
      userStore.getOtherUser(notification.senderUserId).then((senderUser) => {
        setSenderUser(senderUser)
        setIsInitialized(true)
      })
    } else {
      let messageTx
      switch (notification.notificationType) {
        case NotificationType.Comment:
          messageTx = "notificationsScreen.commentNotificationMessage"
          break
        case NotificationType.Like:
          messageTx = "notificationsScreen.likeNotificationMessage"
          break
        case NotificationType.FollowRequest:
          messageTx = "notificationsScreen.followRequestNotificationMessage"
          break
        case NotificationType.FollowAccepted:
          messageTx = "notificationsScreen.followAcceptedNotificationMessage"
          break
      }
      const senderName = formatName(senderUser.firstName, senderUser.lastName)
      setMessage(`${senderName} ${translate(messageTx)}`)
    }
  }, [isInitialized])

  const handleOnPress = () => {
    switch (notification.notificationType) {
      case NotificationType.Comment:
        mainNavigation.navigate("WorkoutSummary", {
          workoutSource: WorkoutSource.User,
          workoutId: notification.workoutId,
          jumpToComments: true,
        })
        break
      case NotificationType.Like:
        mainNavigation.navigate("WorkoutSummary", {
          workoutSource: WorkoutSource.User,
          workoutId: notification.workoutId,
          jumpToComments: false,
        })
        break
      case NotificationType.FollowRequest:
        mainNavigation.navigate("ProfileVisitorView", {
          userId: notification.senderUserId,
        })
        break
      case NotificationType.FollowAccepted:
        mainNavigation.navigate("ProfileVisitorView", {
          userId: notification.senderUserId,
        })
        break
    }

    if (!notification.isRead) {
      userStore.markNotificationAsRead(notification.notificationId)
    }
  }

  const acceptFollowRequest = () => {
    console.debug("NotificationTile: Accept follow request")
  }

  const declineFollowRequest = () => {
    console.debug("NotificationTile: Confirm and decline follow request")
  }

  if (!isInitialized) return null

  return (
    <TouchableOpacity onPress={handleOnPress}>
      <RowView style={$notificationTileContainer}>
        <Avatar user={senderUser} />
        <View style={styles.flex1}>
          <Text style={$notificationText} weight="bold" text={senderUser.userHandle} />
          <Text style={$notificationText} text={message} />
        </View>
        {notification.notificationType === NotificationType.FollowRequest && (
          <RowView style={styles.alignCenter}>
            <Icon name="checkmark-circle" size={32} onPress={acceptFollowRequest} />
            <Icon name="close-outline" size={32} onPress={declineFollowRequest} />
          </RowView>
        )}
      </RowView>
    </TouchableOpacity>
  )
}

export const NotificationsScreen = observer(() => {
  const { userStore } = useStores()
  const [isInitialized, setIsInitialized] = useState(false)
  const [newNotifications, setNewNotifications] = useState<Notification[]>([])
  const [oldNotifications, setOldNotifications] = useState<Notification[]>([])
  const [pendingFollowRequests, setPendingFollowRequests] = useState<FollowRequest[]>([])
  const [showFollowRequests, setShowFollowRequests] = useState(false)

  useEffect(() => {
    console.debug("NotificationsScreen.useEffect [] called")
    if (isInitialized) {
      setNewNotifications(userStore.newNotifications)
      setOldNotifications(userStore.oldNotifications)
      setPendingFollowRequests(userStore.pendingFollowRequests)
    } else {
      userStore.loadNotifications().then(() => {
        setIsInitialized(true)
      })
    }
  }, [
    isInitialized,
    userStore.newNotifications,
    userStore.oldNotifications,
    userStore.pendingFollowRequests,
  ])

  const toggleShowFollowRequests = () => {
    setShowFollowRequests(!showFollowRequests)
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text tx="notificationsScreen.notificationsTitle" preset="screenTitle" />
      <SectionList
        sections={[
          {
            title: translate("notificationsScreen.newNotificationsTitle"),
            data: newNotifications,
          },
          {
            title: translate("notificationsScreen.olderNotificationsTitle"),
            data: oldNotifications,
          },
        ]}
        ListHeaderComponent={() => (
          <>
            {pendingFollowRequests?.length > 0 && (
              <TouchableOpacity onPress={toggleShowFollowRequests}>
                <RowView style={$followRequestsRow}>
                  <Text tx="notificationsScreen.followRequestsTitle" />
                  <RowView style={styles.alignCenter}>
                    <Text text={pendingFollowRequests.length.toString()} />
                    <Icon
                      name={showFollowRequests ? "chevron-up-outline" : "chevron-down-outline"}
                      size={32}
                    />
                  </RowView>
                </RowView>
              </TouchableOpacity>
            )}
            {showFollowRequests && (
              <FlatList
                data={pendingFollowRequests}
                renderItem={({ item }) => <FollowRequestTile followRequest={item} />}
                keyExtractor={(item) => item.requestId}
                ItemSeparatorComponent={() => <Divider orientation="horizontal" />}
              />
            )}
            {newNotifications.length + oldNotifications.length + pendingFollowRequests.length ===
              0 && <Text tx="notificationsScreen.noNotificationsMessage" />}
          </>
        )}
        renderItem={({ item }) => <NotificationTile notification={item} />}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 ? <Text style={$sectionHeader} preset="subheading" text={title} /> : null
        }
        keyExtractor={(item) => item.notificationId}
        ItemSeparatorComponent={() => <Divider orientation="horizontal" />}
        stickySectionHeadersEnabled={false}
      />
    </Screen>
  )
})

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

const $followRequestsRow: ViewStyle = {
  justifyContent: "space-between",
  alignItems: "center",
  marginVertical: spacing.small,
}

const $sectionHeader: ViewStyle = {
  marginVertical: spacing.small,
}

const $notificationTileContainer: ViewStyle = {
  alignItems: "center",
  gap: spacing.small,
  paddingHorizontal: spacing.tiny,
}

const $notificationText: TextStyle = {
  flex: 1,
  flexWrap: "wrap",
}
