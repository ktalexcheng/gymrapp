import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RowView, Screen, Text } from "app/components"
import { ExercisePerformed, ExerciseSet, ExerciseSetType } from "app/data/model"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { View, ViewStyle } from "react-native"

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
    let summaryText = `${set.weight} x ${set.reps}`
    if (set.rpe) summaryText += ` @ ${set.rpe}`

    return (
      <RowView key={index}>
        <RowView>
          <Text style={{ width: spacing.extraLarge }}>
            {set.setType === ExerciseSetType.Normal ? index : set.setType}
          </Text>
          <Text>{summaryText}</Text>
        </RowView>
      </RowView>
    )
  }

  return (
    <View style={$exerciseSummaryContainer}>
      <Text preset="bold">{exerciseInfo.exerciseName}</Text>
      {exercise.setsPerformed.map((s, i) => renderSetSummary(s, i))}
    </View>
  )
}

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { userStore } = useStores()

  if (userStore.isLoadingWorkouts) return null

  const { workout } = userStore.workouts.get(route.params.workoutId)

  return (
    <Screen safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text preset="heading">{workout.workoutTitle}</Text>
      <Text preset="subheading">
        {(workout.endTime as FirebaseFirestoreTypes.Timestamp).toDate().toLocaleString()}
      </Text>
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
