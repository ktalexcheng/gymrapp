import { Button, Divider, PopoverTMG as Popover } from "app/components"
import { WorkoutSource } from "app/data/constants"
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
import { SaveWorkoutAsTemplateModal } from "./SaveWorkoutAsTemplateModal"

export enum WorkoutSummaryActions {
  EditWorkout = "EditWorkout",
  SaveAsTemplate = "SaveAsTemplate",
  DeleteWorkout = "DeleteWorkout",
}

interface WorkoutSummaryMenuProps {
  workoutSource: WorkoutSource
  workoutId: WorkoutId
  enabledActionItems: Array<WorkoutSummaryActions>
  onBusyChange?: (isBusy: boolean) => void
}

export const WorkoutSummaryMenu = observer((props: WorkoutSummaryMenuProps) => {
  const { workoutSource, workoutId, enabledActionItems, onBusyChange } = props
  const { feedStore, themeStore, workoutEditorStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false)

  // derived states
  const workout = feedStore.getWorkout(workoutSource, workoutId)
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
            if (onBusyChange) onBusyChange(true)
            feedStore.deleteWorkout(workoutId).then(() => {
              if (onBusyChange) onBusyChange(false)
              mainNavigation.goBack()
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

  return (
    <>
      <Popover trigger={<EllipsisVertical color={themeStore.colors("foreground")} size={24} />}>
        <View style={styles.fullWidth}>
          {enabledActionItems.includes(WorkoutSummaryActions.EditWorkout) && (
            <Popover.Close>
              <Button
                preset="menuItem"
                tx="workoutSummaryMenu.editWorkoutButtonLabel"
                onPress={goToEditWorkout}
              />
            </Popover.Close>
          )}
          {enabledActionItems.includes(WorkoutSummaryActions.SaveAsTemplate) && (
            <Popover.Close asChild>
              <Button
                preset="menuItem"
                tx="workoutSummaryMenu.saveAsTemplateButtonLabel"
                onPress={() => {
                  setShowSaveAsTemplateModal(true)
                }}
              />
            </Popover.Close>
          )}
          {enabledActionItems.includes(WorkoutSummaryActions.DeleteWorkout) && (
            <>
              <Divider orientation="horizontal" spaceSize={spacing.extraSmall} />
              <Popover.Close>
                <Button
                  preset="menuItem"
                  tx="common.delete"
                  textStyle={{ color: themeStore.colors("danger") }}
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
