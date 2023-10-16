import { RowView, Spacer, Text } from "app/components"
import { ExerciseSetType, WeightUnit } from "app/data/constants"
import { ExercisePerformed, ExerciseSet } from "app/data/model"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { Weight } from "app/utils/weight"
import React from "react"
import { View, ViewStyle } from "react-native"

export type ExerciseSummaryProps = {
  exercise: ExercisePerformed
}

export const ExerciseSummary = (props: ExerciseSummaryProps) => {
  const { exerciseStore, userStore } = useStores()
  const weightUnitTx = useWeightUnitTx()
  const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
  const { exercise } = props
  const exerciseName = exerciseStore.getExerciseName(props.exercise.exerciseId)

  const $exerciseSummaryContainer: ViewStyle = {
    marginTop: spacing.small,
  }

  function renderSetSummary(set: ExerciseSet, index: number) {
    const weight = new Weight(set.weight, WeightUnit.kg, userWeightUnit)
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
      <Text preset="bold">{exerciseName}</Text>
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
