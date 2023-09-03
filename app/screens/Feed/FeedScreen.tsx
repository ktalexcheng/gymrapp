import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Spacer, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { TabScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { FlatList, View } from "react-native"
import { WorkoutSummaryCard } from "../FinishedWorkout"

interface FeedScreenProps extends NativeStackScreenProps<TabScreenProps<"Profile">> {}

export const FeedScreen: FC<FeedScreenProps> = observer(function FeedScreen() {
  const { feedStore } = useStores()

  function getFeedWorkoutData() {
    return feedStore.feedItems.map((item) => {
      return {
        ...feedStore.feedWorkouts.get(item.workoutId),
        byUser: feedStore.feedUsers.get(item.byUserId).user,
        workoutSource: WorkoutSource.Feed,
      }
    })
  }

  function renderFeedWorkoutItem({ item }) {
    return <WorkoutSummaryCard {...item} />
  }

  function renderScreen() {
    if (feedStore.isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <Text tx="common.loading" />
        </View>
      )
    }

    if (feedStore.feedItems.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text tx="feedScreen.emptyFeed" />
        </View>
      )
    }

    return (
      <FlatList
        data={getFeedWorkoutData()}
        renderItem={renderFeedWorkoutItem}
        ItemSeparatorComponent={() => <Spacer type="vertical" size="small" />}
      />
    )
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={styles.screenContainer}>
      <View style={styles.headingContainer}>
        <Text tx="common.appTitle" preset="heading" />
      </View>
      {renderScreen()}
    </Screen>
  )
})
