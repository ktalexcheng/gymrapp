import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RowView, Screen, Spacer, Text } from "app/components"
import { ExerciseSetType, WeightUnit, WorkoutSource } from "app/data/constants"
import { ExercisePerformed, ExerciseSet, Workout } from "app/data/model"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { MainStackParamList } from "app/navigators"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React from "react"
import { View, ViewStyle } from "react-native"

type ExerciseSummaryProps = {
  exercise: ExercisePerformed
}

const ExerciseSummary = (props: ExerciseSummaryProps) => {
  const { exerciseStore, userStore } = useStores()
  const weightUnitTx = useWeightUnitTx()
  const { exercise } = props
  const exerciseInfo = exerciseStore.allExercises.get(props.exercise.exerciseId)

  const $exerciseSummaryContainer: ViewStyle = {
    marginTop: spacing.small,
  }

  function renderSetSummary(set: ExerciseSet, index: number) {
    const weight = new Weight(set.weight, WeightUnit.kg, userStore.getUserPreference("weightUnit"))
    let summaryText = `${weight.formattedDisplayWeight(1)} ${translate(weightUnitTx)} x ${set.reps}`
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
      {exercise.exerciseNotes && (
        <>
          <Text preset="light">{exercise.exerciseNotes}</Text>
          <Spacer type="vertical" size="small" />
        </>
      )}
      {exercise.setsPerformed.map((s, i) => renderSetSummary(s, i))}
    </View>
  )
}

interface WorkoutSummaryScreenProps
  extends NativeStackScreenProps<MainStackParamList, "WorkoutSummary"> {}

export const WorkoutSummaryScreen = observer(({ route }: WorkoutSummaryScreenProps) => {
  const { feedStore, userStore } = useStores()

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
