import { Button, Icon, RowView, Text, TextField } from "app/components"
import { ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { useExerciseSetting, useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExercisePerformedModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry } from "./SetEntry"
import { WorkoutEditorV2Props } from "./WorkoutEditor"

type ExerciseEntryProps = Omit<WorkoutEditorV2Props, "allExercises" | "onAddExerciseNavigateTo"> & {
  exercise: IExercisePerformedModel
  isPlaceholder?: boolean
  onExerciseNameLongPress?: () => void
}

export const ExerciseEntry: FC<ExerciseEntryProps> = observer((props: ExerciseEntryProps) => {
  const {
    exercise,
    isPlaceholder,
    onExerciseNameLongPress,
    enableExerciseSettingsMenuItems,
    onChangeExerciseSettings,
    onChangeExerciseNotes,
    onRemoveExercise,
    onAddSet,
  } = props
  const { exerciseId, exerciseOrder, exerciseName, volumeType, setsPerformed, exerciseNotes } =
    exercise

  const { themeStore } = useStores()
  const mainNavigation = useMainNavigation()
  const weightUnitTx = useWeightUnitTx(exerciseId)

  const autoRestTimerEnabled = useExerciseSetting<boolean>(
    exerciseId,
    ExerciseSettingsType.AutoRestTimerEnabled,
  )
  const restTime = useExerciseSetting<number>(exerciseId, ExerciseSettingsType.RestTime)
  const weightUnit = useExerciseSetting<WeightUnit>(exerciseId, ExerciseSettingsType.WeightUnit)
  const exerciseSettings = {
    autoRestTimerEnabled,
    restTime,
    weightUnit,
  } as Required<ExerciseSettings>

  function renderSets() {
    return setsPerformed?.map((set) => (
      <SetEntry {...props} key={set.setId} exerciseSettings={exerciseSettings} set={set} />
    ))
  }

  function renderVolumeTypeSpecificHeaders() {
    switch (volumeType) {
      case ExerciseVolumeType.Reps:
        return (
          <>
            <View style={$weightColumn}>
              <Text textAlign="center">
                {translate("workoutEditor.exerciseSetHeaders.weight") +
                  ` (${translate(weightUnitTx)})`}
              </Text>
            </View>
            <View style={$repsColumn}>
              <Text tx="workoutEditor.exerciseSetHeaders.reps" textAlign="center" />
            </View>
            <View style={$rpeColumn}>
              <Text tx="workoutEditor.exerciseSetHeaders.rpe" textAlign="center" />
            </View>
          </>
        )
      case ExerciseVolumeType.Time:
        return (
          <View style={$timeColumn}>
            <Text tx="workoutEditor.exerciseSetHeaders.time" textAlign="center" />
          </View>
        )
      default:
        return null
    }
  }

  function navigateToExerciseDetails() {
    mainNavigation.navigate("ExerciseDetails", {
      exerciseId,
    })
  }

  const $exercise: ViewStyle = {
    marginTop: spacing.medium,
    opacity: isPlaceholder ? 0.5 : 1,
  }

  return (
    <View style={$exercise}>
      <RowView style={styles.justifyBetween}>
        <TouchableOpacity onPress={navigateToExerciseDetails} onLongPress={onExerciseNameLongPress}>
          <Text preset="bold">{"#" + (exerciseOrder + 1) + " " + exerciseName}</Text>
        </TouchableOpacity>

        <ExerciseSettingsMenu
          exercise={exercise}
          exerciseSettings={exerciseSettings}
          enableExerciseSettingsMenuItems={enableExerciseSettingsMenuItems}
          onChangeExerciseSettings={onChangeExerciseSettings}
          onRemoveExercise={onRemoveExercise}
        />
      </RowView>

      <TextField
        containerStyle={$exerciseNotesContainer}
        inputWrapperStyle={$exerciseNotesInputWrapper}
        style={$exerciseNotesInputStyle}
        multiline={true}
        value={exerciseNotes ?? undefined}
        onChangeText={(text) => onChangeExerciseNotes(exerciseOrder, text)}
        placeholderTx="workoutEditor.exerciseNotesPlaceholder"
      />

      <RowView style={$exerciseSetsHeader}>
        <View style={$setOrderColumn}>
          <Text tx="workoutEditor.exerciseSetHeaders.set" textAlign="center" />
        </View>
        <View style={$previousColumn}>
          <Text tx="workoutEditor.exerciseSetHeaders.previous" textAlign="center" />
        </View>
        {renderVolumeTypeSpecificHeaders()}
        <View style={$isCompletedColumn}>
          <Icon name="checkmark" color={themeStore.colors("foreground")} size={30} />
        </View>
      </RowView>

      {renderSets()}

      <Button
        preset="text"
        tx="workoutEditor.addSetButtonLabel"
        onPress={() => onAddSet(exerciseOrder)}
      />
    </View>
  )
})

const $exerciseNotesContainer: ViewStyle = {
  width: "90%",
}

const $exerciseNotesInputWrapper: ViewStyle = {
  borderWidth: 0,
  minHeight: 12,
}

const $exerciseNotesInputStyle: ViewStyle = {
  marginHorizontal: spacing.tiny,
}

const $setOrderColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $previousColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $weightColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $repsColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $rpeColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $timeColumn: ViewStyle = {
  flex: 3,
  alignItems: "center",
}

const $isCompletedColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $exerciseSetsHeader: ViewStyle = {
  justifyContent: "space-around",
  marginVertical: spacing.medium,
  alignItems: "center",
}
