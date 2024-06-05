import { useQueryClient } from "@tanstack/react-query"
import { Button, Modal, Spacer, TextField } from "app/components"
import { NewWorkoutTemplate } from "app/data/repository"
import { queries } from "app/features/WorkoutTemplates/services/queryFactory"
import { useCreateTemplate } from "app/features/WorkoutTemplates/services/useCreateTemplate"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IWorkoutSummaryModel, useStores } from "app/stores"
import React, { useState } from "react"

type SaveWorkoutAsTemplateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workout: IWorkoutSummaryModel
}

export const SaveWorkoutAsTemplateModal = (props: SaveWorkoutAsTemplateModalProps) => {
  const { open, onOpenChange, workout } = props
  const templateName = workout.workoutTitle

  const mainNavigation = useMainNavigation()
  const { userStore } = useStores()
  const queryClient = useQueryClient()
  const createTemplate = useCreateTemplate()

  const [workoutTemplateName, setWorkoutTemplateName] = useState(templateName)

  const saveAsTemplate = () => {
    // Save template
    const newTemplate = {
      activityId: workout.activityId,
      createdByUserId: userStore.userId,
      createdFromWorkoutId: workout.workoutId,
      createdFromUserId: workout.byUserId,
      workoutTemplateNotes: workout.workoutNotes,
      workoutTemplateName,
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
        onOpenChange(false)
        queryClient.invalidateQueries({ queryKey: queries.getAll._def })
        mainNavigation.navigate("TemplateManager")
      },
    })
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => onOpenChange(false)}
    >
      <TextField
        autoFocus
        labelTx="workoutSummaryMenu.workoutTemplateNameLabel"
        value={workoutTemplateName}
        onChangeText={setWorkoutTemplateName}
        onSubmitEditing={saveAsTemplate}
      />
      <Spacer type="vertical" size="medium" />
      <Button preset="text" tx="common.save" onPress={saveAsTemplate} />
      <Button preset="text" tx="common.cancel" onPress={() => onOpenChange(false)} />
    </Modal>
  )
}
