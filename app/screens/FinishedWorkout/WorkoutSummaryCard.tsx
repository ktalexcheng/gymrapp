import { Avatar, Icon, RowView, Spacer, Text } from "app/components"
import { ExerciseVolumeType, WeightUnit, WorkoutSource } from "app/data/constants"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExerciseSummaryModel, IUserModel, IWorkoutSummaryModel, useStores } from "app/stores"
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
  workout: IWorkoutSummaryModel
  byUser: IUserModel
  highlightExerciseId?: string
}

export const WorkoutSummaryCard: FC<WorkoutSummaryCardProps> = observer(
  (props: WorkoutSummaryCardProps) => {
    const { workoutSource, workoutId, workout, byUser, highlightExerciseId } = props
    const { exerciseStore, userStore, themeStore } = useStores()
    const mainNavigation = useMainNavigation()
    const userWeightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
    const weightUnitTx = useWeightUnitTx()

    const displayName = `${byUser?.firstName} ${byUser?.lastName}`
    const newRecordsCount = workout?.exercises?.reduce((acc, exercise) => {
      return acc + (exercise?.newRecords?.size ?? 0)
    }, 0)

    const renderBestSet = (e: IExerciseSummaryModel, i: number) => {
      const $highlightExercise: TextStyle =
        highlightExerciseId && highlightExerciseId === e.exerciseId
          ? {
              color: themeStore.colors("tint"),
            }
          : {}
      const $highlightExerciseTextPreset =
        highlightExerciseId && highlightExerciseId === e.exerciseId ? "bold" : "default"

      const bestSet = e.bestSet
      let bestSetString = ""
      let weight: Weight
      switch (bestSet.volumeType) {
        case ExerciseVolumeType.Reps:
          weight = new Weight(bestSet.weight)
          bestSetString += `${weight.getFormattedWeightInUnit(userWeightUnit, 1)} x ${bestSet.reps}`
          if (bestSet.rpe) {
            bestSetString += ` @ ${bestSet.rpe}`
          }
          break

        case ExerciseVolumeType.Time:
          if (bestSet.time) bestSetString += formatSecondsAsTime(bestSet.time)
          else bestSetString += "-"
          break
      }

      return (
        <RowView key={i} style={$workoutItemHeader}>
          <Text
            preset={$highlightExerciseTextPreset}
            numberOfLines={1}
            style={[styles.flex1, $highlightExercise]}
          >
            {exerciseStore.getExerciseName(e.exerciseId) || e?.exerciseName}
          </Text>
          <Spacer type="horizontal" size="small" />
          <Text preset={$highlightExerciseTextPreset} style={$highlightExercise}>
            {bestSetString}
          </Text>
        </RowView>
      )
    }

    const $isLocalOnlyIndicator: ViewStyle = {
      position: "absolute",
      zIndex: 1,
      top: 0,
      left: 0,
      // borderTopLeftRadius: 10,
      borderBottomRightRadius: 10,
      padding: spacing.tiny,
      backgroundColor: themeStore.colors("danger"),
    }

    const $cardHeaderContainer: ViewStyle = {
      alignItems: "center",
      marginBottom: spacing.small,
      justifyContent: "space-between",
      // paddingLeft: workout?.__isLocalOnly ? 20 : undefined,
    }

    return (
      <TouchableOpacity
        onPress={() =>
          mainNavigation.navigate("WorkoutSummary", {
            workoutSource,
            workoutId,
            workoutByUserId: workout.byUserId,
            jumpToComments: false,
          })
        }
      >
        <View style={themeStore.styles("listItemContainer")}>
          {workout?.__isLocalOnly && (
            <RowView style={$isLocalOnlyIndicator}>
              <Icon name="cloud-offline-outline" size={16} />
            </RowView>
          )}
          {byUser && (
            <RowView style={$cardHeaderContainer}>
              <RowView style={$cardHeaderAvatarAndName}>
                <Avatar user={byUser} size="sm" />
                <Spacer type="horizontal" size="small" />
                <Text preset="bold" numberOfLines={1} style={styles.flex1}>
                  {displayName}
                </Text>
              </RowView>
              <Text>{formatDate(workout.startTime)}</Text>
            </RowView>
          )}
          <RowView style={[styles.alignCenter, styles.justifyBetween]}>
            <RowView style={[styles.flex1, styles.alignCenter]}>
              {workout?.isHidden && (
                <>
                  <Icon name="eye-off-outline" size={16} />
                  <Spacer type="horizontal" size="tiny" />
                </>
              )}
              <Text style={styles.flex1} numberOfLines={2} text={workout.workoutTitle} />
            </RowView>
            {newRecordsCount > 0 && (
              <RowView style={styles.alignCenter}>
                <Icon name="trophy" color={themeStore.colors("logo")} size={16} />
                <Spacer type="horizontal" size="tiny" />
                <Text preset="bold" text={newRecordsCount} />
              </RowView>
            )}
          </RowView>
          <WorkoutSocialButtonGroup
            workoutSource={workoutSource}
            workoutId={workoutId}
            workoutByUserId={workout.byUserId}
            onPressComments={() =>
              mainNavigation.navigate("WorkoutSummary", {
                workoutSource,
                workoutId,
                workoutByUserId: workout.byUserId,
                jumpToComments: true,
              })
            }
          />
          <RowView style={$workoutItemHeader}>
            <Text preset="bold" tx="common.exercise" />
            <Text preset="bold">
              {translate("common.bestSet") + ` (${translate(weightUnitTx)})`}
            </Text>
          </RowView>
          {workout?.exercises?.map((e, i) => renderBestSet(e, i))}
        </View>
      </TouchableOpacity>
    )
  },
)

const $workoutItemHeader: ViewStyle = {
  justifyContent: "space-between",
}

const $cardHeaderAvatarAndName: ViewStyle = {
  alignItems: "center",
  flex: 1,
  overflow: "hidden",
  marginRight: spacing.small,
}
