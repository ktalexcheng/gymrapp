import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "app/components"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React from "react"
import { Text, ViewStyle } from "react-native"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = ({ route }: WorkoutSummaryScreenProps) => {
  const { userStore } = useStores()
  const { workoutId, workout } = userStore.workouts.get(route.params.workoutId)

  return (
    <Screen safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text>{workoutId}</Text>
      <Text>{workout.workoutTitle}</Text>
      {/* {workout.exercises.map((e) => {
        return <Text key={e.exerciseId}>{e.}</Text>
      })} */}
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
