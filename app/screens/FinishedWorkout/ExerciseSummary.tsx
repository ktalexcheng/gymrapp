import { RowView, Spacer, Text } from "app/components"
import { ExerciseSetType, ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import {
  IExercisePerformedModel,
  IExerciseSummaryModel,
  ISetPerformedModel,
  useStores,
} from "app/stores"
import { spacing } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import React from "react"
import { View, ViewStyle } from "react-native"

export type ExerciseSummaryProps = {
  exercise: IExercisePerformedModel | IExerciseSummaryModel
}

export const ExerciseSummary = (props: ExerciseSummaryProps) => {
  const { exerciseStore, userStore } = useStores()
  const weightUnitTx = useWeightUnitTx()
  const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
  const { exercise } = props
  const exerciseName =
    exerciseStore.getExerciseName(props.exercise.exerciseId) || props.exercise?.exerciseName

  const $exerciseSummaryContainer: ViewStyle = {
    marginTop: spacing.small,
  }

  function renderSetSummary(set: ISetPerformedModel, setOrder: number) {
    let summaryText = ""
    switch (set.volumeType) {
      case ExerciseVolumeType.Reps:
        summaryText += `${new Weight(
          set.weight ?? 0,
          WeightUnit.kg,
          userWeightUnit,
        ).formattedDisplayWeight(1)} ${translate(weightUnitTx)} x ${set.reps}`
        if (set.rpe) summaryText += ` @ ${set.rpe}`
        break

      case ExerciseVolumeType.Time:
        if (set.time) summaryText += formatSecondsAsTime(set.time)
        break
    }

    return (
      <RowView key={setOrder}>
        <RowView>
          <Text style={{ width: spacing.extraLarge }}>
            {set.setType === ExerciseSetType.Normal ? setOrder + 1 : set.setType}
          </Text>
          <Text>{summaryText}</Text>
        </RowView>
      </RowView>
    )
  }

  return (
    <View style={$exerciseSummaryContainer}>
      <Text preset="bold">{exerciseName}</Text>
      {exercise.exerciseNotes && (
        <>
          <Text preset="light">{exercise.exerciseNotes}</Text>
          <Spacer type="vertical" size="small" />
        </>
      )}
      {exercise?.setsPerformed?.map((s, i) => renderSetSummary(s, i))}
    </View>
  )
}
