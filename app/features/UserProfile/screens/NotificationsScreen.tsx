import { useInfiniteQuery, useQueries } from "@tanstack/react-query"
import {
  Avatar,
  Divider,
  Icon,
  RowView,
  Screen,
  Spacer,
  Text,
  ThemedRefreshControl,
} from "app/components"
import { FirebaseSnapshotType, repositorySingletons } from "app/data/repository"
import { Notification, NotificationType } from "app/data/types"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IFollowRequestsModel, INotificationModel, IUserModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatDateTime } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { add } from "date-fns"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, SectionList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { queries } from "../services/queryFactory"
import { useGetFollowRequests } from "../services/useGetFollowRequests"

type FollowRequestTileProps = {
  followRequest: IFollowRequestsModel
  userProfile: IUserModel
}

const FollowRequestTile = ({ followRequest, userProfile }: FollowRequestTileProps) => {
  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()
  const senderUser = userProfile

  const acceptFollowRequest = () => {
    userStore.acceptFollowRequest(followRequest.requestId)
  }

  const declineFollowRequest = () => {
    userStore.declineFollowRequest(followRequest.requestId)
  }

  if (!senderUser) return null

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

type NotificationTileProps = {
  notification: INotificationModel
  userProfile: IUserModel
}

const NotificationTile = ({ notification, userProfile }: NotificationTileProps) => {
  const mainNavigation = useMainNavigation()
  const { themeStore, userStore } = useStores()
  const senderUser = userProfile

  if (!senderUser) return null

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
  const senderDisplayName = formatName(senderUser.firstName, senderUser.lastName)
  const message = translate(messageTx, { senderDisplayName })

  const handleOnPress = () => {
    if (!notification.isRead) {
      userStore.markNotificationAsRead(notification.notificationId)
    }

    switch (notification.notificationType) {
      case NotificationType.Comment:
        mainNavigation.navigate("WorkoutSummary", {
          workoutId: notification.workoutId,
          jumpToComments: true,
        })
        break
      case NotificationType.Like:
        mainNavigation.navigate("WorkoutSummary", {
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
  }

  const acceptFollowRequest = () => {
    console.debug("NotificationTile: Accept follow request")
  }

  const declineFollowRequest = () => {
    console.debug("NotificationTile: Confirm and decline follow request")
  }

  const $skeletonAvatar: ViewStyle = {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeStore.colors("contentBackground"),
  }

  const $skeletonGroup: ViewStyle = {
    gap: spacing.small,
  }

  const $skeletonText: ViewStyle = {
    height: 20,
    width: 100,
    borderRadius: 10,
    backgroundColor: themeStore.colors("contentBackground"),
  }

  const $followRequestContent: ViewStyle = {
    alignItems: "center",
    marginTop: spacing.small,
  }

  if (!message || !senderUser)
    return (
      <RowView style={$skeletonGroup}>
        <View style={$skeletonAvatar} />
        <View style={$skeletonGroup}>
          <View style={$skeletonText} />
          <View style={$skeletonText} />
        </View>
      </RowView>
    )

  return (
    <TouchableOpacity onPress={handleOnPress}>
      <RowView style={$notificationTileContainer}>
        <Avatar user={senderUser} />
        <View style={styles.flex1}>
          <RowView style={[styles.justifyBetween, styles.alignCenter]}>
            <Text style={$notificationText} weight="bold" text={senderUser.userHandle} />
            <Text size="xs">{formatDateTime(notification.notificationDate)}</Text>
          </RowView>
          <RowView style={styles.alignCenter}>
            <Text style={$notificationText} text={message} />
            {notification.notificationType === NotificationType.FollowRequest && (
              <RowView style={$followRequestContent}>
                <Icon name="checkmark-circle" size={32} onPress={acceptFollowRequest} />
                <Spacer type="horizontal" size="small" />
                <Icon name="close-outline" size={32} onPress={declineFollowRequest} />
              </RowView>
            )}
          </RowView>
        </View>
      </RowView>
    </TouchableOpacity>
  )
}

const { notificationRepository } = repositorySingletons

export const NotificationsScreen = observer(() => {
  const { userStore } = useStores()

  // queries
  // follow requests
  const followRequestsQuery = useGetFollowRequests()
  const pendingFollowRequests = (followRequestsQuery.data ?? [])
    .filter((followRequest) => !followRequest.isAccepted && !followRequest.isDeclined)
    .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())

  // notifications
  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications", userStore.userId],
    queryFn: ({ pageParam }) =>
      notificationRepository.getByFilter<Notification>({
        orderBy: [{ field: "notificationDate", direction: "desc" }],
        afterSnapshot: pageParam,
      }),
    initialPageParam: undefined as unknown as FirebaseSnapshotType,
    getNextPageParam: (lastPage) => lastPage.lastDocSnapshot,
  })
  const notifications = notificationsQuery.data?.pages?.flatMap((page) => page.docData) ?? []

  // user profiles
  const senderIds = Array.from(new Set(notifications.map((n) => n.senderUserId)))
  const usersQuery = useQueries({
    queries: senderIds
      ? senderIds.map((userId) => ({
          ...queries.getUser(userId),
        }))
      : [],
  })
  const userProfiles = usersQuery.reduce((acc, query) => {
    if (query.data) {
      acc[query.data.userId] = query.data
    }
    return acc
  }, {})

  // states
  const [showFollowRequests, setShowFollowRequests] = useState(false)

  // derived states
  // Filter out notifications from deleted users
  const allNotifications = notifications.filter((n) => n.senderUserId in userProfiles)
  const pastDayNotifications = allNotifications.filter(
    (n) => n.notificationDate >= add(new Date(), { days: -1 }),
  )
  const olderNotifications = allNotifications.filter(
    (n) => n.notificationDate < add(new Date(), { days: -1 }),
  )

  useEffect(() => {
    userStore.markAllNotificationsAsRead()
  }, [])

  const toggleShowFollowRequests = () => {
    setShowFollowRequests(!showFollowRequests)
  }

  console.debug("pendingFollowRequests", pendingFollowRequests)
  return (
    <Screen
      safeAreaEdges={["bottom"]}
      contentContainerStyle={$container}
      isBusy={notificationsQuery.isFetching}
    >
      <Text tx="notificationsScreen.notificationsTitle" preset="heading" />
      <SectionList
        refreshControl={
          <ThemedRefreshControl
            refreshing={notificationsQuery.isFetching}
            onRefresh={notificationsQuery.refetch}
          />
        }
        sections={[
          {
            title: translate("notificationsScreen.pastDayNotificationsTitle"),
            data: pastDayNotifications,
          },
          {
            title: translate("notificationsScreen.olderNotificationsTitle"),
            data: olderNotifications,
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
                renderItem={({ item }) => (
                  <FollowRequestTile
                    followRequest={item}
                    userProfile={userProfiles[item.requestedByUserId]}
                  />
                )}
                keyExtractor={(item) => item.requestId}
                ItemSeparatorComponent={() => <Divider orientation="horizontal" />}
              />
            )}
            {pastDayNotifications.length +
              allNotifications.length +
              pendingFollowRequests.length ===
              0 && <Text tx="notificationsScreen.noNotificationsMessage" />}
          </>
        )}
        renderItem={({ item }) => (
          <NotificationTile notification={item} userProfile={userProfiles[item.senderUserId]} />
        )}
        renderSectionHeader={({ section: { title, data } }) =>
          data.length > 0 ? (
            <RowView style={[styles.alignCenter, styles.justifyBetween]}>
              <Text style={$sectionHeader} text={title} />
            </RowView>
          ) : null
        }
        keyExtractor={(item) => item.notificationId}
        ItemSeparatorComponent={() => <Spacer type="vertical" size="medium" />}
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
