import { Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard, WorkoutSummaryCardProps } from "../FinishedWorkout"
import { LoadingScreen } from "../LoadingScreen"

// interface FeedScreenProps extends TabScreenProps<"Profile"> {}

export const FeedScreen = observer(function FeedScreen() {
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
      const feedWorkouts: IWorkoutSummaryModel[] = []
      feedStore.feedWorkouts.forEach((workout) => feedWorkouts.push(workout))
      setFeedData(makeFeedData(feedWorkouts))
    }

    setIsLoading(false)
  }, [userStore.isLoadingProfile, feedStore.isLoadingFeed])

  const makeFeedData = (feedWorkouts: IWorkoutSummaryModel[]) => {
    return feedWorkouts.map(
      (workout) =>
        ({
          workoutSource: WorkoutSource.Feed,
          workoutId: workout.workoutId,
          workout,
          byUser: feedStore.feedUsers.get(workout.byUserId),
        } as WorkoutSummaryCardProps),
    )
  }

  const getMoreFeedItems = () => {
    if (isLoading) return
    if (feedStore.noMoreFeedItems) return

    setIsLoading(true)
    feedStore
      .loadMoreFeedItems()
      .then((newFeedItems) => {
        const newFeedData = makeFeedData(newFeedItems)
        setFeedData((prev) => prev.concat(newFeedData))
      })
      .finally(() => setIsLoading(false))
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
