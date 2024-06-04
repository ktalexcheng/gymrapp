import { useQueryClient } from "@tanstack/react-query"
import { Button, Divider, Modal, Popover, Spacer, Text, TextField } from "app/components"
import { WorkoutSource } from "app/data/constants"
import { NewWorkoutTemplate } from "app/data/repository"
import { WorkoutId } from "app/data/types"
import { LoadingScreen } from "app/features/common"
import { useCreateTemplate } from "app/features/WorkoutTemplates/services/useCreateTemplate"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert, View } from "react-native"

type SaveWorkoutAsTemplateModalProps = {
  visible: boolean
  templateName: string
  onSave: (workoutTemplateName: string) => void
  onCancel: () => void
}

const SaveWorkoutAsTemplateModal = (props: SaveWorkoutAsTemplateModalProps) => {
  const { visible, templateName, onCancel, onSave } = props

  const [workoutTemplateName, setWorkoutTemplateName] = useState(templateName)

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onCancel}>
      <Text />
      <TextField
        autoFocus
        labelTx="workoutSummaryMenu.workoutTemplateNameLabel"
        value={workoutTemplateName}
        onChangeText={setWorkoutTemplateName}
        onSubmitEditing={() => onSave(workoutTemplateName)}
      />
      <Spacer type="vertical" size="medium" />
      <Button preset="text" tx="common.save" onPress={() => onSave(workoutTemplateName)} />
      <Button preset="text" tx="common.cancel" onPress={onCancel} />
    </Modal>
  )
}

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
  const { feedStore, userStore, themeStore, workoutEditorStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false)

  // queries and mutations
  const queryClient = useQueryClient()
  const createTemplate = useCreateTemplate()

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

  const saveAsTemplate = () => {
    // Save template
    const newTemplate = {
      activityId: workout.activityId,
      createdByUserId: userStore.userId,
      createdFromWorkoutId: workout.workoutId,
      createdFromUserId: workout.byUserId,
      workoutTemplateNotes: workout.workoutNotes,
      workoutTemplateName: workout.workoutTitle,
      exercises: workout.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseSource: e.exerciseSource,
        exerciseOrder: e.exerciseOrder,
        exerciseName: e.exerciseName,
        exerciseNotes: e.exerciseNotes,
        volumeType: e.volumeType,
        sets:
          e.setsPerformed?.map((s) => ({
            setId: s.setId,
            setOrder: s.setOrder,
            setType: s.setType,
            volumeType: s.volumeType,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            time: s.time,
          })) ?? [],
      })),
    } as NewWorkoutTemplate

    createTemplate.mutate(newTemplate, {
      onSuccess: () => {
        setShowSaveAsTemplateModal(false)
        queryClient.invalidateQueries()
        mainNavigation.navigate("TemplateManager")
      },
    })
  }

  const PopoverMenuItems = () => {
    return (
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
          <Popover.Close>
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
    )
  }

  return (
    <>
      <SaveWorkoutAsTemplateModal
        visible={showSaveAsTemplateModal}
        templateName={workout.workoutTitle}
        onSave={saveAsTemplate}
        onCancel={() => setShowSaveAsTemplateModal(false)}
      />

      <Popover trigger={<EllipsisVertical color={themeStore.colors("foreground")} size={24} />}>
        <PopoverMenuItems />
      </Popover>
    </>
  )
})
