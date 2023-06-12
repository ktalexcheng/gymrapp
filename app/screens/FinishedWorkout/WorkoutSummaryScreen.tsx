import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "app/components"
import { ExercisePerformed, ExerciseSet } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { Text, View, ViewStyle } from "react-native"

type ExerciseSummaryProps = {
  exercise: ExercisePerformed
}

const ExerciseSummary = (props: ExerciseSummaryProps) => {
  const { exerciseStore } = useStores()
  const { exercise } = props
  const exerciseInfo = exerciseStore.allExercises.get(props.exercise.exerciseId)

  const $exerciseSummaryContainer: ViewStyle = {
    marginTop: spacing.small,
  }

  function renderSetSummary(set: ExerciseSet, index: number) {
    return <Text key={index}>{`${set.setType}, ${set.weight}, ${set.reps}`}</Text>
  }

  return (
    <View style={$exerciseSummaryContainer}>
      <Text>{exerciseInfo.exerciseName}</Text>
      {exercise.setsPerformed.map((s, i) => renderSetSummary(s, i))}
    </View>
  )
}

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { userStore } = useStores()

  if (userStore.isLoadingWorkouts) return null

  const { workoutId, workout } = userStore.workouts.get(route.params.workoutId)

  return (
    <Screen safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text>{workoutId}</Text>
      <Text>{workout.workoutTitle}</Text>
      {workout.exercises.map((e, i) => {
        return <ExerciseSummary key={i} exercise={e} />
      })}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.small,
  paddingHorizontal: spacing.small,
}
