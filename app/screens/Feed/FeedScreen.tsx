import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { FeedItemId, User, UserFeedItem, Workout, WorkoutId } from "app/data/model"
import { TabScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard } from "../FinishedWorkout"
import { LoadingScreen } from "../LoadingScreen"

interface IFeedItemData {
  feedItemId: FeedItemId
  workoutId: WorkoutId
  workout: Workout
  byUser: User
}

interface FeedScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const FeedScreen: FC<FeedScreenProps> = observer(function FeedScreen() {
  const { feedStore, userStore } = useStores()
  const [feedData, setFeedData] = useState<IFeedItemData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    if (userStore.isLoadingProfile || feedStore.isLoadingFeed) return

    // This is only used to display the initial list of feed items,
    // for subsequent feed items loaded on request, we will append to the feedData array
    if (feedData.length === 0) {
      setFeedData(makeFeedData(feedStore.feedItems))
    }

    setIsLoading(false)
  }, [userStore.isLoadingProfile, feedStore.isLoadingFeed])

  const makeFeedData = (feedItems: UserFeedItem[]) => {
    return feedItems.map((feedItem) => {
      const feedWorkout = feedStore.getWorkout(WorkoutSource.Feed, feedItem.workoutId)
      return {
        feedItemId: feedItem.feedItemId,
        workoutId: feedItem.workoutId,
        workout: feedWorkout,
        byUser: feedStore.feedUsers.get(feedItem.byUserId).user,
      }
    })
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
    if (userStore.isLoadingProfile) {
      return <LoadingScreen />
    }

    if (userStore.user.followingCount === 0) {
      return (
        <View style={[styles.flex1, styles.centeredContainer]}>
          <Text tx="feedScreen.notFollowingAnyone" />
        </View>
      )
    }

    if (feedStore.feedItems.length === 0) {
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
          ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
          ListFooterComponent={renderFeedFooterItem()}
          onEndReachedThreshold={0.5}
          onEndReached={getMoreFeedItems}
        />
      </View>
    )
  }

  const isEmptyFeed = () => {
    return (
      userStore.isLoadingProfile ||
      userStore.user.followingCount === 0 ||
      feedStore.feedItems.length === 0
    )
  }

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={styles.screenContainer}
      preset={isEmptyFeed() ? "scroll" : "fixed"}
      ScrollViewProps={{ refreshControl: isEmptyFeed() ? FeedRefreshControl : undefined }}
    >
      <View style={$headingContainer}>
        <Text tx="common.appTitle" preset="heading" />
      </View>
      {renderFeed()}
    </Screen>
  )
})

const $headingContainer: ViewStyle = {
  marginBottom: spacing.large,
}
