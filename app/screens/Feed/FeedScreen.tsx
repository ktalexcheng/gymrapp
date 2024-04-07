import { LoadingIndicator, Screen, Spacer, Text, ThemedRefreshControl } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { IWorkoutSummaryModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard, WorkoutSummaryCardProps } from "../FinishedWorkout"

// interface FeedScreenProps extends TabScreenProps<"Profile"> {}

export const FeedScreen = observer(function FeedScreen() {
  const { feedStore, userStore, activeWorkoutStore, themeStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]
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
    return feedWorkouts
      .map(
        (workout) =>
          ({
            workoutSource: WorkoutSource.Feed,
            workoutId: workout.workoutId,
            workout,
            byUser: feedStore.feedUsers.get(workout.byUserId),
          } as WorkoutSummaryCardProps),
      )
      .sort((a, b) => b.workout.startTime - a.workout.startTime)
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
      return null
    }

    if (feedData.length > 0 && feedStore.noMoreFeedItems) {
      return (
        <View style={styles.alignCenter}>
          <Spacer type="vertical" size="medium" />
          <Text tx="feedScreen.noMoreFeedItems" />
        </View>
      )
    }

    return null
  }

  const refreshFeed = () => {
    setFeedData([])
    feedStore.refreshFeedItems()
  }

  const renderFeed = () => {
    if (userStore.isLoadingProfile || !userStore.user) {
      return <LoadingIndicator />
    }

    return (
      <View style={styles.flex1}>
        <FlatList
          refreshControl={
            <ThemedRefreshControl refreshing={feedStore.isLoadingFeed} onRefresh={refreshFeed} />
          }
          data={feedData}
          renderItem={renderFeedWorkoutItem}
          contentContainerStyle={styles.flexGrow}
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
          ListEmptyComponent={() => {
            if (!userStore.user?.followingCount) {
              return (
                <View style={styles.fillAndCenter}>
                  <Text tx="feedScreen.notFollowingAnyone" />
                </View>
              )
            }

            return (
              <View style={styles.fillAndCenter}>
                <Text tx="feedScreen.noFeedItems" />
              </View>
            )
          }}
        />
      </View>
    )
  }

  return (
    <Screen safeAreaEdges={safeAreaEdges} contentContainerStyle={styles.screenContainer}>
      {/* {__DEV__ && (
        <Button
          text="Test crash"
          onPress={() => {
            try {
              throw new Error("This is a test error")
            } catch (e) {
              logError(e, "Some error message", {
                debugVar: "debugValue",
                anotherVar: "anotherValue",
              })
            }
            // crashlytics().crash()
          }}
        />
      )} */}
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
