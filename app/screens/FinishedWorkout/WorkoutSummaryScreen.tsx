import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen, Text } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { Workout } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { ViewStyle } from "react-native"
import { LoadingScreen } from "../LoadingScreen"
import { ExerciseSummary } from "./ExerciseSummary"

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { feedStore, userStore } = useStores()
  const [workout, setWorkout] = useState<Workout>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let workout: Workout
    switch (route.params.workoutSource) {
      case WorkoutSource.User:
        workout = userStore.workouts.get(route.params.workoutId).workout
        break
      case WorkoutSource.Feed:
        workout = feedStore.feedWorkouts.get(route.params.workoutId).workout
        break
      default:
        throw new Error("Invalid workout source")
    }

    setWorkout(workout)
    setIsLoading(false)
  }, [])

  if (isLoading || !workout) return <LoadingScreen />

  return (
    <Screen safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text preset="heading">{workout.workoutTitle}</Text>
      <Text preset="subheading">{workout.startTime.toLocaleString()}</Text>
      {workout.exercises.map((e, _) => {
        return <ExerciseSummary key={e.exerciseId} exercise={e} />
      })}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
