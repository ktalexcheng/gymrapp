import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "app/components"
import { ActivityType } from "app/data/constants"
import { NewWorkoutTemplate } from "app/data/repository"
import { ExerciseSettingsType } from "app/data/types"
import { WorkoutEditor } from "app/features/WorkoutEditor"
import { MainStackParamList } from "app/navigators"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { IExerciseModel, SetPropType, useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { CreateNewTemplateHeader } from "../components/CreateNewTemplateHeader"
import { useCreateTemplate } from "../services/useCreateTemplate"
import { useUpdateTemplate } from "../services/useUpdateTemplate"

interface EditTemplateScreenProps
  extends NativeStackScreenProps<MainStackParamList, "EditTemplate"> {}

export const EditTemplateScreen = observer((props: EditTemplateScreenProps) => {
  const workoutTemplateId = props.route?.params?.workoutTemplateId

  // utilities
  const mainNavigation = useMainNavigation()
  const { userStore, workoutEditorStore: workoutStore, exerciseStore } = useStores()

  // queries and mutations
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()

  const template = {
    activityId: ActivityType.Gym,
    createdByUserId: userStore.userId!,
    createdFromWorkoutId: undefined,
    workoutTemplateNotes: workoutStore.workoutNotes,
    workoutTemplateName: workoutStore.workoutTitle,
    exercises: workoutStore.exercises.map((e) => ({
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

  const onSave = () => {
    if (workoutTemplateId) {
      updateTemplate.mutate(
        { ...template, workoutTemplateId },
        {
          onSuccess: () => {
            mainNavigation.goBack()
          },
        },
      )
    } else {
      createTemplate.mutate(template, {
        onSuccess: () => {
          mainNavigation.goBack()
        },
      })
    }
  }

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

  const onReorderExercise = (from: number, to: number) => {
    workoutStore.reorderExercise(from, to)
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

  const onChangeWorkoutTitle = (value: string) => {
    workoutStore.setProp("workoutTitle", value)
  }

  const onDiscard = () => {
    workoutStore.resetWorkout()
    mainNavigation.goBack()
  }

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={styles.screenContainer}
      preset="fixed"
    >
      <CreateNewTemplateHeader
        workoutTitle={workoutStore.workoutTitle}
        onChangeWorkoutTitle={onChangeWorkoutTitle}
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
        onReorderExercise={onReorderExercise}
        onChangeSetValue={onChangeSetValue}
        onAddSet={onAddSet}
        onRemoveSet={onRemoveSet}
      />
    </Screen>
  )
})
