import { Avatar, RowView, Spacer, Text } from "app/components"
import { WeightUnit, WorkoutSource } from "app/data/constants"
import { User, Workout } from "app/data/model"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { colors, spacing, styles } from "app/theme"
import { Weight } from "app/utils/weight"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

type WorkoutSummaryCardProps = {
  workoutId: string
  workout: Workout
  workoutSource: WorkoutSource
  byUser?: User
  highlightExerciseId?: string
}

export const WorkoutSummaryCard: FC = (props: WorkoutSummaryCardProps) => {
  // const { workoutId, workout }: { workoutId: string; workout: Workout } = item
  const { workoutId, workout, workoutSource, byUser, highlightExerciseId } = props
  const { exerciseStore, userStore } = useStores()
  const mainNavigation = useMainNavigation()
  const weightUnitTx = useWeightUnitTx()

  const $workoutItemHeader: ViewStyle = {
    justifyContent: "space-between",
  }

  const $byUserHeader: ViewStyle = {
    alignItems: "center",
    gap: spacing.small,
    marginBottom: spacing.small,
  }

  return (
    <TouchableOpacity
      onPress={() => mainNavigation.navigate("WorkoutSummary", { workoutId, workoutSource })}
    >
      <View style={styles.listItem}>
        {byUser && (
          <RowView style={$byUserHeader}>
            <Avatar user={byUser} size="sm" />
            <Text preset="bold">{`${byUser.firstName} ${byUser.lastName}`}</Text>
          </RowView>
        )}
        <RowView style={$workoutItemHeader}>
          <Text>{workout.workoutTitle}</Text>
          <Text>{workout.startTime.toLocaleString()}</Text>
        </RowView>
        <Spacer type="vertical" size="small" />
        <RowView style={$workoutItemHeader}>
          <Text preset="bold" tx="common.exercise" />
          <Text preset="bold">{translate("common.bestSet") + ` (${translate(weightUnitTx)})`}</Text>
        </RowView>
        {workout.exercises.map((e, i) => {
          const bestWeight = new Weight(
            e.maxWeightSet.weight,
            WeightUnit.kg,
            userStore.getUserPreference("weightUnit"),
          )

          let bestSet = `${bestWeight.formattedDisplayWeight(1)} x ${e.maxWeightSet.reps}`
          if (e.maxWeightSet.rpe) {
            bestSet += ` @ ${e.maxWeightSet.rpe}`
          }

          const $highlightExercise: TextStyle =
            highlightExerciseId && highlightExerciseId === e.exerciseId
              ? {
                  color: colors.actionable,
                }
              : undefined
          const $highlightExerciseTextPreset =
            highlightExerciseId && highlightExerciseId === e.exerciseId ? "bold" : "default"

          return (
            <RowView key={i} style={$workoutItemHeader}>
              <Text preset={$highlightExerciseTextPreset} style={$highlightExercise}>
                {exerciseStore.getExerciseName(e.exerciseId)}
              </Text>
              <Text preset={$highlightExerciseTextPreset} style={$highlightExercise}>
                {bestSet}
              </Text>
            </RowView>
          )
        })}
      </View>
    </TouchableOpacity>
  )
}
