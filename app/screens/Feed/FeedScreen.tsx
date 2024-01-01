import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { Workout } from "app/data/model"
import { TabScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard, WorkoutSummaryCardProps } from "../FinishedWorkout"
import { LoadingScreen } from "../LoadingScreen"

interface FeedScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const FeedScreen: FC<FeedScreenProps> = observer(function FeedScreen() {
  const { feedStore, userStore, workoutStore, themeStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = workoutStore.inProgress ? [] : ["top"]
  const [feedData, setFeedData] = useState<WorkoutSummaryCardProps[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userStore.isLoadingProfile || feedStore.isLoadingFeed) {
      setIsLoading(true)
      return
    }

    // This is only used to display the initial list of feed items,
    // for subsequent feed items loaded on request, we will append to the feedData array
    if (feedData.length === 0) {
      const feedWorkouts = []
      feedStore.feedWorkouts.forEach((workout) => feedWorkouts.push(workout.workout))
      setFeedData(makeFeedData(feedWorkouts))
    }

    setIsLoading(false)
  }, [userStore.isLoadingProfile, feedStore.isLoadingFeed])

  const makeFeedData = (feedWorkouts: Workout[]) => {
    return feedWorkouts.map((workout) => ({
      workoutSource: WorkoutSource.Feed,
      workoutId: workout.workoutId,
      workout,
      byUser: feedStore.feedUsers.get(workout.byUserId)?.user,
    }))
  }

  const getMoreFeedItems = async () => {
    if (isLoading) return
    if (feedStore.noMoreFeedItems) return

    setIsLoading(true)
    const newFeedItems = await feedStore.loadMoreFeedItems()
    const newFeedData = makeFeedData(newFeedItems)
    setFeedData((prev) => prev.concat(newFeedData))
    setIsLoading(false)
  }

  const renderFeedWorkoutItem = ({ item }) => {
    return <WorkoutSummaryCard {...item} />
  }

  const renderFeedFooterItem = () => {
    if (isLoading) {
      return <ActivityIndicator />
    }

    if (feedStore.noMoreFeedItems) {
      return (
        <View style={styles.alignCenter}>
          <Spacer type="vertical" size="medium" />
          <Text tx="feedScreen.noMoreFeedItems" />
        </View>
      )
    }

    return null
  }

  const FeedRefreshControl = (
    <RefreshControl
      refreshing={feedStore.isLoadingFeed}
      onRefresh={() => feedStore.refreshFeedItems()}
    />
  )

  const renderFeed = () => {
    if (userStore.isLoadingProfile || !userStore.user) {
      return <LoadingScreen />
    }

    if (userStore.user.followingCount === 0) {
      return (
        <View style={[styles.flex1, styles.centeredContainer]}>
          <Text tx="feedScreen.notFollowingAnyone" />
        </View>
      )
    }

    if (feedStore.feedWorkouts.size === 0) {
      return (
        <View style={[styles.flex1, styles.centeredContainer]}>
          <Text tx="feedScreen.noFeedItems" />
        </View>
      )
    }

    return (
      <View style={styles.flex1}>
        <FlatList
          refreshControl={FeedRefreshControl}
          data={feedData}
          renderItem={renderFeedWorkoutItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListFooterComponent={() => (
            <>
              {renderFeedFooterItem()}
              <Spacer type="vertical" size="extraLarge" />
            </>
          )}
          onEndReachedThreshold={0.5}
          onEndReached={getMoreFeedItems}
        />
      </View>
    )
  }

  const isEmptyFeed = () => {
    return (
      userStore.isLoadingProfile ||
      !userStore.user ||
      userStore.user.followingCount === 0 ||
      feedStore.feedWorkouts.size === 0
    )
  }

  return (
    <Screen
      safeAreaEdges={safeAreaEdges}
      contentContainerStyle={styles.screenContainer}
      preset={isEmptyFeed() ? "scroll" : "fixed"}
      ScrollViewProps={{ refreshControl: isEmptyFeed() ? FeedRefreshControl : undefined }}
    >
      <View style={$headingContainer}>
        <Text tx="common.appTitle" preset="screenTitle" textColor={themeStore.colors("logo")} />
      </View>
      {renderFeed()}
    </Screen>
  )
})

const $headingContainer: ViewStyle = {
  marginBottom: spacing.large,
}
