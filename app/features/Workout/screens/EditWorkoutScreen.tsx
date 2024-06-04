import { Screen } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { ExerciseSettingsType } from "app/data/types"
import { CreateNewTemplateHeader } from "app/features/WorkoutTemplates"
import { useInternetStatus, useToast } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExerciseModel, SetPropType, useStores } from "app/stores"
import { styles } from "app/theme"
import { toJS } from "mobx"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert } from "react-native"
import { WorkoutEditor } from "../../WorkoutEditor"

export const EditWorkoutScreen = observer(() => {
  const mainNavigation = useMainNavigation()
  const { workoutEditorStore: workoutStore, userStore, exerciseStore, feedStore } = useStores()
  const [toastShowTx] = useToast()
  const isInternetConnected = useInternetStatus()
  const [isBusy, setIsBusy] = useState(false)

  const onChangeExerciseSettings = (
    exerciseId: string,
    settingItem: ExerciseSettingsType,
    value: any,
  ) => {
    exerciseStore.updateExerciseSetting(exerciseId, settingItem, value)
  }

  const onChangeExerciseNotes = (exerciseOrder: number, value: string) => {
    workoutStore.updateExerciseNotes(exerciseOrder, value)
  }

  const onAddExercise = (exercise: IExerciseModel) => {
    workoutStore.addExercise(exercise)
  }

  const onRemoveExercise = (exerciseOrder: number) => {
    workoutStore.removeExercise(exerciseOrder)
  }

  const onChangeSetValue = (
    exerciseOrder: number,
    setOrder: number,
    prop: SetPropType | "isCompleted",
    value: number | null | boolean,
  ) => {
    workoutStore.updateSetValues(exerciseOrder, setOrder, prop, value)
  }

  const onAddSet = (exerciseOrder: number) => {
    workoutStore.addSet(exerciseOrder)
  }

  const onRemoveSet = (exerciseOrder: number, setOrder: number) => {
    workoutStore.removeSet(exerciseOrder, setOrder)
  }

  function updateWorkout() {
    if (userStore.user) {
      setIsBusy(true)
      workoutStore
        .updateWorkout(workoutStore.isHidden, toJS(userStore.user), false, !isInternetConnected)
        .then((updatedWorkout) => {
          // If the workout update was aborted when prompted for confirmation, updatedWorkout will be undefined
          if (updatedWorkout) {
            console.debug("WorkoutEditor.updateWorkout():", { updatedWorkout })
            feedStore.addWorkoutToStore(WorkoutSource.User, updatedWorkout)
          }
          mainNavigation.goBack()
        })
        .finally(() => setIsBusy(false))
    } else {
      toastShowTx("common.error.unknownErrorMessage")
    }
  }

  const onSave = () => {
    workoutStore.cleanUpWorkout()
    const allExerciseSummary = workoutStore.getAllExerciseSummary(
      toJS(userStore.user),
      workoutStore.workoutId,
    )
    const isExerciseModified = workoutStore.checkIsExerciseModified(
      toJS(userStore.user),
      allExerciseSummary,
    )

    if (isExerciseModified) {
      Alert.alert(
        translate("editWorkoutScreen.editWorkoutWarningTitle"),
        translate("editWorkoutScreen.editWorkoutWarningMessage"),
        [
          {
            text: translate("common.cancel"),
            style: "cancel",
          },
          {
            text: translate("common.save"),
            onPress: () => updateWorkout(),
          },
        ],
      )
    } else {
      updateWorkout()
    }
  }

  const onDiscard = () => {
    workoutStore.resetWorkout()
    mainNavigation.goBack()
  }

  return (
    <Screen
      safeAreaEdges={["top"]}
      contentContainerStyle={styles.screenContainer}
      preset="fixed"
      isBusy={isBusy}
    >
      {/* Reusing CreateNewTemplateHeader from templates screen */}
      <CreateNewTemplateHeader
        workoutTitle={workoutStore.workoutTitle}
        onChangeWorkoutTitle={workoutStore.setProp.bind(workoutStore, "workoutTitle")}
        onSave={onSave}
        onDiscard={onDiscard}
      />

      <WorkoutEditor
        workoutNotes={workoutStore.workoutNotes}
        onChangeWorkoutNotes={workoutStore.setProp.bind(workoutStore, "workoutNotes")}
        allExercises={workoutStore.exercises}
        enableExerciseSettingsMenuItems={Object.values(ExerciseSettingsType)}
        onChangeExerciseSettings={onChangeExerciseSettings}
        onChangeExerciseNotes={onChangeExerciseNotes}
        onAddExercise={onAddExercise}
        onRemoveExercise={onRemoveExercise}
        onChangeSetValue={onChangeSetValue}
        onAddSet={onAddSet}
        onRemoveSet={onRemoveSet}
      />
    </Screen>
  )
})
