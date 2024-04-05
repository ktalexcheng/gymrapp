import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Button, RowView, Screen, Spacer, Text, ThemedRefreshControl } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { MainStackParamList } from "app/navigators"
import { IUserModel, IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatDate } from "app/utils/formatDate"
import { formatName } from "app/utils/formatName"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard } from "../FinishedWorkout"
import { UserProfileStatsBar } from "./UserProfileStatsBar"
interface ProfileVisitorViewScreenProps
  extends NativeStackScreenProps<MainStackParamList, "ProfileVisitorView"> {}

export const ProfileVisitorViewScreen: FC<ProfileVisitorViewScreenProps> = observer(
  ({ navigation, route }: ProfileVisitorViewScreenProps) => {
    const otherUserId = route.params.userId
    const { userStore, feedStore } = useStores()
    const [otherUser, setOtherUser] = useState<IUserModel>()
    const [isInitialized, setIsInitialized] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowRequested, setIsFollowRequested] = useState(false)
    const [isProcessingFollowRequest, setIsProcessingFollowRequest] = useState(false)

    let otherUserIsPrivate, otherUserWorkouts, workouts, isEndOfFeed, otherUserFeed
    if (otherUser) {
      otherUserIsPrivate = otherUser?.privateAccount
      otherUserWorkouts = feedStore.otherUserWorkouts.get(otherUserId)
      workouts = otherUserWorkouts?.workouts
      isEndOfFeed = otherUserWorkouts?.noMoreItems
      otherUserFeed =
        workouts &&
        Array.from(workouts.values())
          .map((workout: IWorkoutSummaryModel) => ({
            workoutSource: WorkoutSource.OtherUser,
            workoutId: workout.workoutId,
            workout,
          }))
          .sort((a, b) => b.workout.startTime - a.workout.startTime)
    }

    const isLoading = feedStore.isLoadingOtherUserWorkouts
    const isReadyForDisplay = !!otherUser && !isLoading

    useEffect(() => {
      userStore.getOtherUser(otherUserId).then((user) => {
        setOtherUser(user)
        navigation.setOptions({ title: user.userHandle })
      })

      const unsubscribe = firestore()
        .collection("users")
        .doc(otherUserId)
        .onSnapshot((doc) => {
          const data = convertFirestoreTimestampToDate(doc.data())
          setOtherUser(data)
        })

      return unsubscribe
    }, [])

    useEffect(() => {
      if (!isInitialized && otherUser) {
        refreshFeed().then(() => setIsInitialized(true))
      }
    }, [otherUser])

    const refreshFeed = async () => {
      const _isFollowing = await updateFollowStatus()

      if (otherUserIsPrivate === false || (otherUserIsPrivate === true && _isFollowing)) {
        await feedStore.refreshOtherUserWorkouts(otherUserId)
      }
    }

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
          <RowView>
            <Avatar user={otherUser} size="lg" />
            <Spacer type="horizontal" size="medium" />
            <View>
              <Text preset="subheading">{formatName(otherUser.firstName, otherUser.lastName)}</Text>
              <RowView>
                <Text preset="formLabel" tx="profileVisitorViewScreen.dateJoinedLabel" />
                <Spacer type="horizontal" size="small" />
                <Text preset="formLabel">
                  {otherUser._createdAt ? formatDate(otherUser._createdAt, "MMM dd, yyyy") : ""}
                </Text>
              </RowView>
            </View>
          </RowView>
          <UserProfileStatsBar user={otherUser} containerStyle={$userProfileStatsBar} />
          {renderFollowUnfollowButton()}
          <Spacer type="vertical" size="medium" />
        </>
      )
    }

    return (
      <Screen
        safeAreaEdges={["bottom"]}
        contentContainerStyle={styles.screenContainer}
        preset="fixed"
        isBusy={!isReadyForDisplay}
      >
        <FlatList
          refreshControl={<ThemedRefreshControl refreshing={isLoading} onRefresh={refreshFeed} />}
          data={otherUserFeed}
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

            if (!isLoading && isEndOfFeed && otherUserFeed.length === 0) {
              return (
                <View style={styles.fillAndCenter}>
                  <Text tx="profileVisitorViewScreen.noActivityHistoryMessage" />
                </View>
              )
            }

            return null
          }}
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListHeaderComponent={profileHeaderComponent()}
          ListFooterComponent={() => {
            if (!isEndOfFeed) return null

            return (
              <>
                <Spacer type="vertical" size="medium" />
                <Text tx="profileVisitorViewScreen.endOfUserActivityMessage" textAlign="center" />
              </>
            )
          }}
          onEndReachedThreshold={0.5}
          onEndReached={loadMoreWorkouts}
        />
      </Screen>
    )
  },
)

const $userProfileStatsBar: ViewStyle = {
  marginVertical: spacing.medium,
}
