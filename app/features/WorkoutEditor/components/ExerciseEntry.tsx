import { Button, Icon, RowView, Spacer, Text, TextField } from "app/components"
import { ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { CircuitTimerSheet } from "app/features/Workout/components/CircuitTimerSheet"
import { useExerciseSetting, useToast, useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExercisePerformedModel, useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { Timer, TriangleAlert } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry } from "./SetEntry"
import { WorkoutEditorProps } from "./WorkoutEditor"

type ExerciseEntryProps = Omit<WorkoutEditorProps, "allExercises" | "onAddExerciseNavigateTo"> & {
  exercise: IExercisePerformedModel
  isPlaceholder?: boolean
  onExerciseNameLongPress?: () => void
  onPressReplaceExercise: () => void
}

export const ExerciseEntry: FC<ExerciseEntryProps> = observer((props: ExerciseEntryProps) => {
  const {
    isTemplate = false,
    exercise,
    isPlaceholder,
    onExerciseNameLongPress,
    enableExerciseSettingsMenuItems,
    onChangeExerciseSettings,
    onPressReplaceExercise,
    onChangeExerciseNotes,
    onRemoveExercise,
    onAddSet,
    onUpdateSetsFromCircuitTimer,
    disableSetCompletion,
  } = props
  const {
    exerciseId,
    exerciseOrder,
    exerciseName,
    volumeType,
    setsPerformed,
    exerciseNotes,
    templateExerciseNotes,
  } = exercise

  // utilities
  const { themeStore, exerciseStore } = useStores()
  const mainNavigation = useMainNavigation()
  const weightUnitTx = useWeightUnitTx(exerciseId)
  const [toastShowTx] = useToast()

  // states
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
  const [openCircuitTimer, setOpenCircuitTimer] = React.useState(false)

  // derived states
  const isExerciseFound = !!exerciseStore.getExercise(exerciseId)

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
    if (!isExerciseFound) {
      toastShowTx("exerciseSummary.exerciseNotFoundMessage")
      return
    }

    mainNavigation.navigate("ExerciseDetails", {
      exerciseId,
    })
  }

  const $exercise: ViewStyle = {
    marginTop: spacing.medium,
    opacity: isPlaceholder ? 0.5 : 1,
  }

  const $templateNotes: ViewStyle = {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: themeStore.colors("separator"),
    flex: 1,
    padding: spacing.small,
    margin: spacing.extraSmall,
  }

  return (
    <View style={$exercise}>
      <RowView style={styles.justifyBetween}>
        <TouchableOpacity onPress={navigateToExerciseDetails} onLongPress={onExerciseNameLongPress}>
          <RowView style={styles.alignCenter}>
            {!isExerciseFound && (
              <>
                <TriangleAlert
                  size={16}
                  color={themeStore.colors(isExerciseFound ? "foreground" : "error")}
                />
                <Spacer type="horizontal" size="tiny" />
              </>
            )}
            <Text
              preset="bold"
              textColor={themeStore.colors(isExerciseFound ? "foreground" : "error")}
              text={"#" + (exerciseOrder + 1) + " " + exerciseName}
            />
          </RowView>
        </TouchableOpacity>

        <RowView style={styles.alignCenter}>
          {volumeType === ExerciseVolumeType.Time && (
            <>
              <CircuitTimerSheet
                exerciseName={exerciseName}
                open={openCircuitTimer}
                onOpenChange={setOpenCircuitTimer}
                initialWorkTime={120}
                initialRestTime={90}
                initialSets={1}
                onComplete={(sets) =>
                  onUpdateSetsFromCircuitTimer && onUpdateSetsFromCircuitTimer(exerciseOrder, sets)
                }
              />

              <TouchableOpacity onPress={() => setOpenCircuitTimer(true)}>
                <Timer size={24} color={themeStore.colors("foreground")} />
              </TouchableOpacity>
              <Spacer type="horizontal" size="small" />
            </>
          )}

          <ExerciseSettingsMenu
            exercise={exercise}
            exerciseSettings={exerciseSettings}
            enableExerciseSettingsMenuItems={enableExerciseSettingsMenuItems}
            onChangeExerciseSettings={onChangeExerciseSettings}
            onPressReplaceExercise={onPressReplaceExercise}
            onRemoveExercise={onRemoveExercise}
          />
        </RowView>
      </RowView>

      {!isTemplate && templateExerciseNotes && (
        <View style={$templateNotes}>
          <Text tx="activeWorkoutScreen.instructionsLabel" size="tiny" />
          <Text text={templateExerciseNotes} />
        </View>
      )}

      <TextField
        containerStyle={$exerciseNotesContainer}
        inputWrapperStyle={$exerciseNotesInputWrapper}
        style={$exerciseNotesInputStyle}
        multiline={true}
        value={(isTemplate ? templateExerciseNotes : exerciseNotes) ?? undefined}
        onChangeText={(text) => onChangeExerciseNotes(exerciseOrder, text)}
        placeholder={
          isTemplate
            ? translate("workoutEditor.templateExerciseNotesPlaceholder")
            : translate("workoutEditor.exerciseNotesPlaceholder")
        }
      />

      <RowView style={$exerciseSetsHeader}>
        <View style={$setOrderColumn}>
          <Text tx="workoutEditor.exerciseSetHeaders.set" textAlign="center" />
        </View>
        <View style={$previousColumn}>
          <Text tx="workoutEditor.exerciseSetHeaders.previous" textAlign="center" />
        </View>
        {renderVolumeTypeSpecificHeaders()}
        {!disableSetCompletion && (
          <View style={$isCompletedColumn}>
            <Icon name="checkmark" color={themeStore.colors("foreground")} size={30} />
          </View>
        )}
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
