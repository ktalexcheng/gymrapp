import { Divider, PopoverTMG as Popover, PopoverMenuItem } from "app/components"
import { WorkoutId } from "app/data/types"
import { LoadingScreen } from "app/features/common"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert, View } from "react-native"
import { useDeleteWorkout } from "../services/useDeleteWorkout"
import { useGetWorkout } from "../services/useGetWorkout"
import { SaveWorkoutAsTemplateModal } from "./SaveWorkoutAsTemplateModal"

export enum WorkoutSummaryActions {
  EditWorkout = "EditWorkout",
  SaveAsTemplate = "SaveAsTemplate",
  DeleteWorkout = "DeleteWorkout",
}

interface WorkoutSummaryMenuProps {
  workoutId: WorkoutId
  enabledActionItems: Array<WorkoutSummaryActions>
}

export const WorkoutSummaryMenu = observer((props: WorkoutSummaryMenuProps) => {
  const { workoutId, enabledActionItems } = props

  // hooks
  const { themeStore, workoutEditorStore, exerciseStore } = useStores()
  const mainNavigation = useMainNavigation()

  // queries
  const workoutQuery = useGetWorkout(workoutId)
  const workout = workoutQuery.data
  const deleteWorkout = useDeleteWorkout()

  // states
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false)

  if (!workout) return <LoadingScreen />

  const showDeleteConfirmationAlert = () => {
    Alert.alert(
      translate("workoutSummaryMenu.deleteWorkoutAlertTitle"),
      translate("workoutSummaryMenu.deleteWorkoutAlertMessage"),
      [
        {
          text: translate("common.cancel"),
          style: "cancel",
        },
        {
          text: translate("common.delete"),
          onPress: () => {
            deleteWorkout.mutate(workoutId, {
              onSuccess: () => mainNavigation.goBack(),
            })
          },
          style: "destructive",
        },
      ],
    )
  }

  const goToEditWorkout = () => {
    workoutEditorStore.resetWorkout()
    workoutEditorStore.hydrateWithWorkout(workout)
    mainNavigation.navigate("EditWorkout")
  }

  const saveAsTemplate = () => {
    const exerciseNotFound = workout.exercises.filter(
      (e) => !exerciseStore.getExercise(e.exerciseId),
    )

    if (exerciseNotFound.length > 0) {
      Alert.alert(
        translate("workoutSummaryMenu.replacePrivateExercisesAlertTitle"),
        translate("workoutSummaryMenu.replacePrivateExercisesAlertMessage"),
        [
          {
            text: translate("workoutSummaryMenu.doNotReplacePrivateExercisesButtonLabel"),
            style: "default",
            onPress: () => setShowSaveAsTemplateModal(true),
          },
          {
            text: translate("workoutSummaryMenu.doReplacePrivateExercisesButtonLabel"),
            style: "destructive",
            onPress: () => {
              workoutEditorStore.resetWorkout()
              workoutEditorStore.hydrateWithWorkout(workout)
              mainNavigation.navigate("EditTemplate")
            },
          },
        ],
      )

      return
    }

    setShowSaveAsTemplateModal(true)
  }

  return (
    <>
      <Popover trigger={<EllipsisVertical color={themeStore.colors("foreground")} size={24} />}>
        <View style={styles.fullWidth}>
          {enabledActionItems.includes(WorkoutSummaryActions.EditWorkout) && (
            <Popover.Close>
              <PopoverMenuItem
                itemNameLabelTx="workoutSummaryMenu.editWorkoutButtonLabel"
                onPress={goToEditWorkout}
              />
            </Popover.Close>
          )}
          {enabledActionItems.includes(WorkoutSummaryActions.SaveAsTemplate) && (
            <Popover.Close asChild>
              <PopoverMenuItem
                itemNameLabelTx="workoutSummaryMenu.saveAsTemplateButtonLabel"
                onPress={saveAsTemplate}
              />
            </Popover.Close>
          )}
          {enabledActionItems.includes(WorkoutSummaryActions.DeleteWorkout) && (
            <>
              <Divider orientation="horizontal" spaceSize={spacing.extraSmall} />
              <Popover.Close>
                <PopoverMenuItem
                  itemNameLabelTx="common.delete"
                  textColor={themeStore.colors("danger")}
                  onPress={showDeleteConfirmationAlert}
                />
              </Popover.Close>
            </>
          )}
        </View>
      </Popover>

      <SaveWorkoutAsTemplateModal
        open={showSaveAsTemplateModal}
        onOpenChange={setShowSaveAsTemplateModal}
        workout={workout}
      />
    </>
  )
})
