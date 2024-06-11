import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Avatar,
  Button,
  LoadingIndicator,
  Popover,
  PopoverMenuItem,
  RowView,
  Screen,
  Spacer,
  Text,
  ThemedRefreshControl,
} from "app/components"
import { WorkoutSummaryCard } from "app/features/WorkoutSummary"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { IUserModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDate } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { EllipsisVertical, HeartCrack } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useState } from "react"
import { Alert, FlatList, View, ViewStyle } from "react-native"
import { ReportAbusePanel } from "../ReportAbuse"
import { UserProfileStatsBar } from "./components/UserProfileStatsBar"

type ProfileVisitorViewScreenMenuProps = {
  userIsBlocked: boolean
  onBlockUserPress: () => void
  onUnblockUserPress: () => void
  onReportUserPress: () => void
}

const ProfileVisitorViewScreenMenu = observer((props: ProfileVisitorViewScreenMenuProps) => {
  const { userIsBlocked, onBlockUserPress, onUnblockUserPress, onReportUserPress } = props
  const { themeStore } = useStores()
  // const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Popover trigger={<EllipsisVertical color={themeStore.colors("foreground")} />}>
      <Popover.Close>
        <PopoverMenuItem
          textColor={themeStore.colors("danger")}
          itemNameLabelTx={
            userIsBlocked
              ? "profileVisitorViewScreen.unblockUserButtonLabel"
              : "profileVisitorViewScreen.blockUserButtonLabel"
          }
          onPress={() => {
            if (userIsBlocked) {
              onUnblockUserPress()
            } else {
              onBlockUserPress()
            }
          }}
        />
      </Popover.Close>
      <Popover.Close>
        <PopoverMenuItem
          textColor={themeStore.colors("danger")}
          itemNameLabelTx="profileVisitorViewScreen.reportUserLabel"
          onPress={onReportUserPress}
        />
      </Popover.Close>
    </Popover>
  )
})

interface ProfileVisitorViewScreenProps
  extends NativeStackScreenProps<MainStackParamList, "ProfileVisitorView"> {}

export const ProfileVisitorViewScreen: FC<ProfileVisitorViewScreenProps> = observer(
  ({ navigation, route }: ProfileVisitorViewScreenProps) => {
    const otherUserId = route.params.userId
    const { userStore, feedStore, themeStore } = useStores()
    const [otherUser, setOtherUser] = useState<IUserModel>(
      feedStore.otherUserProfiles.get(otherUserId),
    )
    const [isLoadingOtherUser, setIsLoadingOtherUser] = useState(
      !feedStore.otherUserProfiles.get(otherUserId),
    )
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowRequested, setIsFollowRequested] = useState(false)
    const [isProcessingFollowRequest, setIsProcessingFollowRequest] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [isInvalidUser, setIsInvalidUser] = useState(false)
    const [isShowReportAbusePanel, setIsShowReportAbusePanel] = useState(false)

    // Derived states
    let otherUserIsPrivate, otherUserMeta, isEndOfFeed, otherUserFeed
    if (otherUser) {
      otherUserIsPrivate = otherUser?.privateAccount
      otherUserMeta = feedStore.otherUserMetas.get(otherUserId)
      otherUserFeed = feedStore.getOtherUserWorkoutsListData(otherUserId)
      isEndOfFeed = otherUserMeta?.noMoreItems
    }

    const isLoadingFeed = feedStore.isLoadingOtherUserWorkouts
    const isUserBlocked = feedStore.isUserBlocked(otherUserId)

    // Listen to user document changes for following status updates
    useEffect(() => {
      const unsubscribe = firestore()
        .collection("users")
        .doc(otherUserId)
        .onSnapshot((doc) => {
          const data = convertFirestoreTimestampToDate(doc.data())
          setOtherUser(data)
        })

      return unsubscribe
    }, [])

    // If otherUser is not available, fetch it
    useEffect(() => {
      if (!otherUser) {
        console.debug("ProfileVisitorViewScreen: Fetching other user")
        setIsLoadingOtherUser(true)
        feedStore
          .fetchUserProfileToStore(otherUserId)
          .then((user) => {
            if (!user) {
              setIsInvalidUser(true)
              return
            }
            setOtherUser(user)
            refreshFeed()
          })
          .finally(() => setIsLoadingOtherUser(false))
      } else {
        updateFollowStatus()
        console.debug("ProfileVisitorViewScreen: Setting navigation title to user handle", {
          title: otherUser.userHandle,
        })
        navigation.setOptions({ title: otherUser.userHandle })
      }

      setIsBlocked(isUserBlocked)
    }, [otherUser, isUserBlocked])

    const onBlockUserPress = () => {
      Alert.alert(
        translate("profileVisitorViewScreen.blockUserAlertTitle", {
          userHandle: otherUser.userHandle,
        }),
        translate("profileVisitorViewScreen.blockUserAlertMessage", {
          userHandle: otherUser.userHandle,
        }),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("common.block"),
            onPress: () => feedStore.blockUser(otherUserId),
            style: "destructive",
          },
        ],
      )
    }

    const onUnblockUserPress = () => {
      Alert.alert(
        translate("profileVisitorViewScreen.unblockUserAlertTitle", {
          userHandle: otherUser.userHandle,
        }),
        translate("profileVisitorViewScreen.unblockUserAlertMessage", {
          userHandle: otherUser.userHandle,
        }),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("common.unblock"),
            onPress: () => feedStore.unblockUser(otherUserId),
          },
        ],
      )
    }

    // Handles relationship validation before fetching feed
    const refreshFeed = useCallback(async () => {
      if (isUserBlocked) return

      const _isFollowing = await updateFollowStatus()

      if (otherUserIsPrivate === false || (otherUserIsPrivate === true && _isFollowing)) {
        await feedStore.refreshOtherUserWorkouts(otherUserId)
      }
    }, [isUserBlocked])

    const updateFollowStatus = async () => {
      const _isFollowing = await userStore.isFollowingUser(otherUserId)
      setIsFollowing(_isFollowing)
      const _isFollowRequested = await userStore.isFollowRequested(otherUserId)
      setIsFollowRequested(_isFollowRequested)

      return _isFollowing
    }

    const loadMoreWorkouts = () => {
      if (otherUserIsPrivate === false || (otherUserIsPrivate === true && isFollowing)) {
        feedStore.loadMoreOtherUserWorkouts(otherUserId)
      }
    }

    const renderFollowUnfollowButton = () => {
      if (isBlocked) {
        return <Button tx="common.unblock" preset="dangerOutline" onPress={onUnblockUserPress} />
      }

      if (isProcessingFollowRequest) {
        return <Button disabled={true} tx="common.loading" />
      }

      if (isFollowing) {
        return (
          <Button
            tx="profileVisitorViewScreen.unfollowButtonLabel"
            onPress={() => {
              setIsProcessingFollowRequest(true)
              userStore
                .unfollowUser(otherUserId)
                .then(() => refreshFeed())
                .finally(() => setIsProcessingFollowRequest(false))
            }}
          />
        )
      }

      if (isFollowRequested) {
        return (
          <Button
            tx="profileVisitorViewScreen.followRequestSentMessage"
            preset="reversed"
            onPress={() => {
              setIsProcessingFollowRequest(true)
              userStore
                .cancelFollowRequest(otherUserId)
                .then(() => refreshFeed())
                .finally(() => setIsProcessingFollowRequest(false))
            }}
          />
        )
      }

      return (
        <Button
          tx="profileVisitorViewScreen.followButtonLabel"
          onPress={() => {
            setIsProcessingFollowRequest(true)
            userStore
              .followUser(otherUserId)
              .then(() => refreshFeed())
              .finally(() => setIsProcessingFollowRequest(false))
          }}
        />
      )
    }

    const profileHeaderComponent = () => {
      if (!otherUser) return null

      return (
        <>
          <RowView style={styles.justifyBetween}>
            <RowView style={styles.flex1}>
              <Avatar user={otherUser} size="lg" />
              <Spacer type="horizontal" size="medium" />
              <View style={styles.flex1}>
                <Text preset="subheading" numberOfLines={1}>
                  {formatName(otherUser.firstName, otherUser.lastName)}
                </Text>
                <RowView style={styles.flex1}>
                  <Text preset="formLabel" tx="profileVisitorViewScreen.dateJoinedLabel" />
                  <Spacer type="horizontal" size="small" />
                  <Text preset="formLabel" numberOfLines={1}>
                    {otherUser._createdAt ? formatDate(otherUser._createdAt, "MMM dd, yyyy") : ""}
                  </Text>
                </RowView>
              </View>
            </RowView>
            <ProfileVisitorViewScreenMenu
              userIsBlocked={isBlocked}
              onBlockUserPress={onBlockUserPress}
              onUnblockUserPress={onUnblockUserPress}
              onReportUserPress={() => setIsShowReportAbusePanel(true)}
            />
          </RowView>
          <UserProfileStatsBar
            user={otherUser}
            containerStyle={$userProfileStatsBar}
            hideActivitesCount={!otherUserFeed?.length}
          />
          {renderFollowUnfollowButton()}
          <Spacer type="vertical" size="medium" />
        </>
      )
    }

    const renderContent = () => {
      if (isInvalidUser)
        return (
          <View style={styles.fillAndCenter}>
            <HeartCrack size={56} color={themeStore.colors("logo")} />
            <Spacer type="vertical" size="medium" />
            <Text tx="profileVisitorViewScreen.invalidUserMessage" />
          </View>
        )

      return (
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={isLoadingFeed} onRefresh={refreshFeed} />
          }
          data={!isBlocked && otherUserFeed}
          renderItem={({ item }) => {
            return <WorkoutSummaryCard {...item} byUser={otherUser} />
          }}
          contentContainerStyle={styles.flexGrow}
          ListEmptyComponent={() => {
            if (!isFollowing && otherUserIsPrivate) {
              return (
                <View style={[styles.flex1, styles.centeredContainer]}>
                  <Text tx="profileVisitorViewScreen.userIsPrivateMessage" />
                </View>
              )
            }

            if (!isLoadingFeed && isEndOfFeed && otherUserFeed.length === 0) {
              return (
                <View style={styles.fillAndCenter}>
                  <Text tx="profileVisitorViewScreen.noActivityHistoryMessage" />
                </View>
              )
            }

            return null
          }}
          // ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListHeaderComponent={profileHeaderComponent()}
          ListFooterComponent={() => {
            if (isEndOfFeed && otherUserFeed?.length > 0) {
              return (
                <>
                  <Spacer type="vertical" size="medium" />
                  <Text tx="profileVisitorViewScreen.endOfUserActivityMessage" textAlign="center" />
                </>
              )
            }

            if (isLoadingFeed) {
              return (
                <>
                  <Spacer type="vertical" size="small" />
                  <LoadingIndicator size="small" />
                </>
              )
            }

            return null
          }}
          onEndReachedThreshold={0.5}
          onEndReached={loadMoreWorkouts}
        />
      )
    }

    return (
      <>
        <Screen
          safeAreaEdges={["bottom"]}
          contentContainerStyle={styles.screenContainer}
          preset="fixed"
          isBusy={isLoadingOtherUser}
        >
          {renderContent()}
        </Screen>
        {isShowReportAbusePanel && (
          <ReportAbusePanel
            open={isShowReportAbusePanel}
            onOpenChange={setIsShowReportAbusePanel}
            onSubmitReport={async (reasons, otherReason, blockUser) => {
              await feedStore.reportUser(otherUserId, reasons, otherReason)
              if (blockUser) {
                await feedStore.blockUser(otherUserId)
              }
            }}
            txPanelTitle="profileVisitorViewScreen.reportUserTitle"
            txPanelMessage="profileVisitorViewScreen.reportUserMessage"
            txConfirmReportButtonLabel="profileVisitorViewScreen.confirmReportUserButtonLabel"
          />
        )}
      </>
    )
  },
)

const $userProfileStatsBar: ViewStyle = {
  marginVertical: spacing.medium,
}
