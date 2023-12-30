import { Avatar, RowView, Spacer, Text } from "app/components"
import { ExerciseVolumeType, WeightUnit, WorkoutSource } from "app/data/constants"
import { ExercisePerformed, User, Workout } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { formatDate } from "app/utils/formatDate"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { WorkoutSocialButtonGroup } from "./WorkoutSocialButtonGroup"

export interface WorkoutSummaryCardProps {
  workoutSource: WorkoutSource
  workoutId: string
  workout: Workout
  byUser: User
  highlightExerciseId?: string
}

export const WorkoutSummaryCard: FC<WorkoutSummaryCardProps> = observer(
  (props: WorkoutSummaryCardProps) => {
    const { workoutSource, workoutId, workout, byUser, highlightExerciseId } = props
    const { exerciseStore, userStore, themeStore } = useStores()
    const mainNavigation = useMainNavigation()
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")

    const renderBestSet = (e: ExercisePerformed, i: number) => {
      const $highlightExercise: TextStyle =
        highlightExerciseId && highlightExerciseId === e.exerciseId
          ? {
              color: themeStore.colors("tint"),
            }
          : undefined
      const $highlightExerciseTextPreset =
        highlightExerciseId && highlightExerciseId === e.exerciseId ? "bold" : "default"

      const bestSet = e.bestSet
      let bestSetString = ""
      switch (bestSet.volumeType) {
        case ExerciseVolumeType.Reps:
          bestSetString += `${new Weight(
            bestSet.weight,
            WeightUnit.kg,
            userWeightUnit,
          ).formattedDisplayWeight(1)} x ${bestSet.reps}`
          if (bestSet.rpe) {
            bestSetString += ` @ ${bestSet.rpe}`
          }
          break

        case ExerciseVolumeType.Time:
          bestSetString += formatSecondsAsTime(bestSet.time)
          break
      }

      return (
        <RowView key={i} style={$workoutItemHeader}>
          <Text preset={$highlightExerciseTextPreset} style={$highlightExercise}>
            {exerciseStore.getExerciseName(e.exerciseId)}
          </Text>
          <Text preset={$highlightExerciseTextPreset} style={$highlightExercise}>
            {bestSetString}
          </Text>
        </RowView>
      )
    }

    return (
      <TouchableOpacity
        onPress={() =>
          mainNavigation.navigate("WorkoutSummary", {
            workoutSource,
            workoutId,
            workout,
            jumpToComments: false,
          })
        }
      >
        <View style={themeStore.styles("listItemContainer")}>
          {byUser && (
            <RowView style={$byUserHeader}>
              <RowView style={styles.alignCenter}>
                <Avatar user={byUser} size="sm" />
                <Spacer type="horizontal" size="small" />
                <Text preset="bold">{`${byUser.firstName} ${byUser.lastName}`}</Text>
              </RowView>
              <Text>{formatDate(workout.startTime)}</Text>
            </RowView>
          )}
          <Text>{workout.workoutTitle}</Text>
          <WorkoutSocialButtonGroup
            workoutSource={workoutSource}
            workoutId={workoutId}
            workoutByUserId={workout.byUserId}
            onPressComments={() =>
              mainNavigation.navigate("WorkoutSummary", {
                workoutSource,
                workoutId,
                workout,
                jumpToComments: true,
              })
            }
          />
          <RowView style={$workoutItemHeader}>
            <Text preset="bold" tx="common.exercise" />
            <Text preset="bold" tx="common.bestSet" />
          </RowView>
          {workout.exercises.map((e, i) => renderBestSet(e, i))}
        </View>
      </TouchableOpacity>
    )
  },
)

const $workoutItemHeader: ViewStyle = {
  justifyContent: "space-between",
}

const $byUserHeader: ViewStyle = {
  alignItems: "center",
  marginBottom: spacing.small,
  justifyContent: "space-between",
}
