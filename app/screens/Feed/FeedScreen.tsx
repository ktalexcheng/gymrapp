import { Screen, Spacer, Text, ThemedRefreshControl } from "app/components"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { ExtendedEdge } from "app/utils/useSafeAreaInsetsStyle"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { FlatList, View, ViewStyle } from "react-native"
import { WorkoutSummaryCard } from "../FinishedWorkout"

// interface FeedScreenProps extends TabScreenProps<"Profile"> {}

export const FeedScreen = observer(function FeedScreen() {
  const { feedStore, userStore, activeWorkoutStore, themeStore } = useStores()
  const safeAreaEdges: ExtendedEdge[] = activeWorkoutStore.inProgress ? [] : ["top"]
  const [feedItems, setFeedItems] = useState(feedStore.feedListData)

  // UX improvement: Replacing feedItems in one action only once new data is ready
  // to prevent flickering during loading
  useEffect(() => {
    if (!feedStore.isLoadingFeed && feedStore.feedListData.length > 0) {
      setFeedItems(feedStore.feedListData)
    }
  }, [feedStore.isLoadingFeed, feedStore.feedListData])

  const renderFeedWorkoutItem = ({ item }) => {
    return <WorkoutSummaryCard {...item} />
  }

  const renderFeedFooterItem = () => {
    if (feedStore.isLoadingFeed) {
      return null
    }

    if (feedItems.length > 0 && feedStore.noMoreFeedItems) {
      return (
        <View style={styles.alignCenter}>
          <Spacer type="vertical" size="medium" />
          <Text tx="feedScreen.noMoreFeedItems" />
        </View>
      )
    }

    return null
  }

  const renderFeed = () => {
    return (
      <View style={styles.flex1}>
        <FlatList
          refreshControl={
            <ThemedRefreshControl
              refreshing={feedStore.isLoadingFeed}
              onRefresh={feedStore.refreshFeedItems}
            />
          }
          data={feedItems}
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
          onEndReached={feedStore.loadMoreFeedItems}
          ListEmptyComponent={() => {
            if (userStore?.user?.followingCount) {
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
