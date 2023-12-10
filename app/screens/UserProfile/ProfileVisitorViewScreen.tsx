import firestore from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Avatar, Button, RowView, Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { User, WorkoutId } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { api } from "app/services/api"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { FlatList, RefreshControl, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard, WorkoutSummaryCardProps } from "../FinishedWorkout"
import { LoadingScreen } from "../LoadingScreen"
import { UserProfileStatsBar } from "./UserProfileStatsBar"

interface ProfileVisitorViewScreenProps
  extends NativeStackScreenProps<MainStackParamList, "ProfileVisitorView"> {}

export const ProfileVisitorViewScreen: FC<ProfileVisitorViewScreenProps> = observer(
  ({ route }: ProfileVisitorViewScreenProps) => {
    const otherUserId = route.params.userId
    const { userStore } = useStores()
    const [otherUser, setOtherUser] = useState<User>(undefined)
    const [otherUserFeed, setOtherUserFeed] = useState<WorkoutSummaryCardProps[]>([])
    const [otherUserLastFeedId, setOtherUserLastFeedId] = useState<WorkoutId>(undefined)
    const [isEndOfFeed, setIsEndOfFeed] = useState<boolean>(false)
    const [isFollowing, setIsFollowing] = useState<boolean>(false)
    const [isFollowRequested, setIsFollowRequested] = useState<boolean>(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

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

    useEffect(() => {
      const refresh = async () => {
        setIsInitialized(false)
        await loadOtherUser()
        setOtherUserFeed([])
        setOtherUserLastFeedId(undefined)
        setIsEndOfFeed(false)
        setIsInitialized(true)
        await loadMoreWorkouts()
      }

      refresh()
    }, [userStore.user, refreshKey])

    const refreshFeed = () => {
      setRefreshKey((prev) => prev + 1)
    }

    const loadOtherUser = async () => {
      await userStore.getOtherUser(otherUserId).then((user) => setOtherUser(user))
      await userStore
        .isFollowingUser(otherUserId)
        .then((isFollowing) => setIsFollowing(isFollowing))
      await userStore
        .isFollowRequested(otherUserId)
        .then((isFollowRequested) => setIsFollowRequested(isFollowRequested))
    }

    const loadMoreWorkouts = async () => {
      setIsLoading(true)

      if (!isInitialized || isEndOfFeed || (otherUser.privateAccount && !isFollowing)) {
        setIsLoading(false)
        return
      }

      await api
        .getOtherUserWorkouts(otherUserId, otherUserLastFeedId)
        .then(({ lastWorkoutId, noMoreItems, workouts }) => {
          const newFeedItems = workouts.map((workout) => ({
            workoutSource: WorkoutSource.Feed,
            workoutId: workout.workoutId,
            workout,
            byUser: otherUser,
          }))
          setOtherUserFeed((prev) => prev.concat(newFeedItems))
          setIsEndOfFeed(noMoreItems)
          setOtherUserLastFeedId(lastWorkoutId)
        })

      setIsLoading(false)
    }

    const profileHeaderComponent = () => {
      if (isLoading) return null

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

      return (
        <>
          <RowView>
            <Avatar user={otherUser} size="lg" />
            <Spacer type="horizontal" size="medium" />
            <View>
              <Text preset="heading">{`${otherUser.firstName} ${otherUser.lastName}`}</Text>
              <RowView>
                <Text preset="formLabel" tx="profileVisitorViewScreen.dateJoinedLabel" />
                <Spacer type="horizontal" size="small" />
                <Text preset="formLabel">{otherUser._createdAt.toLocaleString()}</Text>
              </RowView>
            </View>
          </RowView>
          <UserProfileStatsBar user={otherUser} containerStyle={$userProfileStatsBar} />
          {renderFollowUnfollowButton()}
          <Spacer type="vertical" size="medium" />
        </>
      )
    }

    const renderFeedItem = ({ item }) => {
      return <WorkoutSummaryCard {...item} />
    }

    const FeedRefreshControl = <RefreshControl refreshing={isLoading} onRefresh={refreshFeed} />

    const renderFeed = () => {
      if (!isFollowing && otherUser.privateAccount) {
        return (
          <>
            {profileHeaderComponent()}
            <View style={[styles.flex1, styles.centeredContainer]}>
              <Text tx="profileVisitorViewScreen.userIsPrivateMessage" />
            </View>
          </>
        )
      }

      if (isEndOfFeed && otherUserFeed.length === 0) {
        return (
          <>
            {profileHeaderComponent()}
            <View style={[styles.flex1, styles.centeredContainer]}>
              <Text tx="profileVisitorViewScreen.noActivityHistoryMessage" />
            </View>
          </>
        )
      }

      return (
        <FlatList
          refreshControl={FeedRefreshControl}
          data={otherUserFeed}
          renderItem={renderFeedItem}
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListHeaderComponent={profileHeaderComponent()}
          onEndReachedThreshold={0.5}
          onEndReached={loadMoreWorkouts}
        />
      )
    }

    if (isLoading) {
      return <LoadingScreen />
    }

    return (
      <Screen
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={styles.screenContainer}
        preset="fixed"
      >
        {renderFeed()}
      </Screen>
    )
  },
)

const $userProfileStatsBar: ViewStyle = {
  marginVertical: spacing.medium,
}
