import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Button, RowView, Screen, Spacer, Text } from "app/components"
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
  ({ route }: ProfileVisitorViewScreenProps) => {
    const otherUserId = route.params.userId
    const { userStore, feedStore } = useStores()
    const [otherUser, setOtherUser] = useState<IUserModel>()
    const [isFollowing, setIsFollowing] = useState<boolean>(false)
    const [isFollowRequested, setIsFollowRequested] = useState<boolean>(false)

    let otherUserWorkouts, workouts, isEndOfFeed, otherUserFeed
    if (otherUser) {
      otherUserWorkouts = feedStore.otherUserWorkouts.get(otherUserId)
      workouts = otherUserWorkouts?.workouts
      isEndOfFeed = otherUserWorkouts?.noMoreItems
      otherUserFeed =
        workouts &&
        Array.from(workouts.values()).map((workout: IWorkoutSummaryModel) => ({
          workoutSource: WorkoutSource.OtherUser,
          workoutId: workout.workoutId,
          workout,
        }))
    }

    const isLoading = feedStore.isLoadingOtherUserWorkouts
    const isReadyForDisplay = !!otherUser && !isLoading

    useEffect(() => {
      refreshFeed()
      const unsubscribe = firestore()
        .collection("users")
        .doc(otherUserId)
        .onSnapshot((doc) => {
          const data = convertFirestoreTimestampToDate(doc.data())
          setOtherUser(data)
        })

      return unsubscribe
    }, [])

    const refreshFeed = async () => {
      updateFollowStatus()
      await feedStore.refreshOtherUserWorkouts(otherUserId)
    }

    const updateFollowStatus = async () => {
      await userStore
        .isFollowingUser(otherUserId)
        .then((isFollowing) => setIsFollowing(isFollowing))
      await userStore
        .isFollowRequested(otherUserId)
        .then((isFollowRequested) => setIsFollowRequested(isFollowRequested))
    }

    const loadMoreWorkouts = () => {
      feedStore.loadMoreOtherUserWorkouts(otherUserId)
    }

    const renderFollowUnfollowButton = () => {
      if (isFollowing) {
        return (
          <Button
            tx="profileVisitorViewScreen.unfollowButtonLabel"
            onPress={() => userStore.unfollowUser(otherUserId).then(() => refreshFeed())}
          />
        )
      }

      if (isFollowRequested) {
        return (
          <Button
            tx="profileVisitorViewScreen.followRequestSentMessage"
            preset="reversed"
            onPress={() => userStore.cancelFollowRequest(otherUserId).then(() => refreshFeed())}
          />
        )
      }

      return (
        <Button
          tx="profileVisitorViewScreen.followButtonLabel"
          onPress={() => userStore.followUser(otherUserId).then(() => refreshFeed())}
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
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={styles.screenContainer}
        preset="fixed"
        isBusy={!isReadyForDisplay}
      >
        <FlatList
          refreshing={isLoading}
          onRefresh={refreshFeed}
          data={otherUserFeed}
          renderItem={({ item }) => {
            return <WorkoutSummaryCard {...item} byUser={otherUser} />
          }}
          contentContainerStyle={styles.flexGrow}
          ListEmptyComponent={() => {
            if (!isFollowing && otherUser?.privateAccount) {
              return (
                <View style={[styles.flex1, styles.centeredContainer]}>
                  <Text tx="profileVisitorViewScreen.userIsPrivateMessage" />
                </View>
              )
            }

            console.debug("isEndOfFeed", isEndOfFeed)
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
