import { Icon, RowView, Spacer, Text } from "app/components"
import { ExerciseSetType, ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { useToast, useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import {
  IExercisePerformedModel,
  IExerciseSummaryModel,
  ISetPerformedModel,
  useStores,
} from "app/stores"
import { spacing, styles } from "app/theme"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import React from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

export type ExerciseSummaryProps = {
  byUserId: string
  exercise: IExercisePerformedModel | IExerciseSummaryModel
}

export const ExerciseSummary = (props: ExerciseSummaryProps) => {
  const { byUserId, exercise } = props
  const { themeStore, exerciseStore, userStore } = useStores()
  const weightUnitTx = useWeightUnitTx()
  const mainNavigation = useMainNavigation()
  const [toastShowTx] = useToast()

  const exerciseId = exercise.exerciseId
  const isMyWorkout = byUserId === userStore.userId
  const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
  const exerciseName = exerciseStore.getExerciseName(exerciseId) || exercise?.exerciseName

  const $exerciseSummaryContainer: ViewStyle = {
    marginTop: spacing.small,
  }

  function renderSetSummary(set: ISetPerformedModel, setOrder: number) {
    let summaryText = "-"
    let weight: Weight
    switch (set.volumeType) {
      case ExerciseVolumeType.Reps:
        weight = new Weight(set.weight)
        summaryText = `${weight.getFormattedWeightInUnit(userWeightUnit, 1)} ${translate(
          weightUnitTx,
        )}  x ${set.reps ?? 0}`
        if (set.rpe) summaryText += ` @ ${set.rpe}`
        break

      case ExerciseVolumeType.Time:
        if (set.time) summaryText = formatSecondsAsTime(set.time)
        break
    }

    const $setSummaryText: ViewStyle = {
      alignItems: "center",
      justifyContent: "space-between",
      opacity: set.isCompleted ? 1 : 0.5,
    }

    return (
      <RowView key={setOrder} style={$setSummaryText}>
        <RowView>
          <Text style={{ width: spacing.extraLarge }}>
            {set.setType === ExerciseSetType.Normal ? setOrder + 1 : set.setType}
          </Text>
          <Text>{summaryText}</Text>
        </RowView>
        <RowView style={styles.alignCenter}>
          {set.isNewRecord && <Icon name="trophy" color={themeStore.colors("logo")} size={16} />}
          <Icon name={set.isCompleted ? "checkmark" : "close"} size={16} />
        </RowView>
      </RowView>
    )
  }

  function handleOnPress() {
    if (isMyWorkout) {
      mainNavigation.navigate("ExerciseDetails", { exerciseId })
    } else {
      toastShowTx("exerciseSummary.userExerciseHistoryHiddenMessage")
    }
  }

  return (
    <TouchableOpacity onPress={handleOnPress}>
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
    </TouchableOpacity>
  )
}
