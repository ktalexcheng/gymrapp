import { Button, Spacer, TextField } from "app/components"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { useToast } from "app/hooks"
import { IExerciseModel, IExercisePerformedModel, SetPropType } from "app/stores"
import { spacing } from "app/theme"
import { logError } from "app/utils/logger"
import { toJS } from "mobx"
import { observer } from "mobx-react-lite"
import React, { useCallback, useRef, useState } from "react"
import { FlatList, ViewStyle } from "react-native"
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist"
import { ExerciseEntry } from "./ExerciseEntry"
import { ExercisePickerSheet } from "./ExercisePickerSheet"

export type WorkoutEditorProps = {
  workoutNotes?: string | null
  onChangeWorkoutNotes: (value: string) => void
  allExercises: IExercisePerformedModel[]
  enableExerciseSettingsMenuItems?: Array<ExerciseSettingsType>
  onChangeExerciseSettings?: (
    exerciseId: string,
    settingItem: keyof ExerciseSettings,
    value: any,
  ) => void
  onReplaceExercise: (exerciseOrder: number, newExercise: IExerciseModel) => void
  onChangeExerciseNotes: (exerciseOrder: number, value: string) => void
  onAddExercise: (exercise: IExerciseModel) => void
  onRemoveExercise: (exerciseOrder: number) => void
  onReorderExercise: (from: number, to: number) => void
  onChangeSetValue: (
    exerciseOrder: number,
    setOrder: number,
    prop: SetPropType | "isCompleted",
    value: number | null | boolean,
  ) => void
  disableSetCompletion?: boolean
  onCompleteSet?: (settings: { autoRestTimerEnabled: boolean; restTime: number }) => void
  onAddSet: (exerciseOrder: number) => void
  onRemoveSet: (exerciseOrder: number, setOrder: number) => void
  ExtraHeaderComponent?: React.JSXElementConstructor<any>
}

export const WorkoutEditor = observer((props: WorkoutEditorProps) => {
  const {
    workoutNotes,
    onReplaceExercise,
    onChangeWorkoutNotes,
    allExercises,
    onAddExercise,
    onReorderExercise,
    ExtraHeaderComponent,
  } = props

  // utilities
  const [useToastTx] = useToast()

  // states
  const exercisesRef = useRef<FlatList<IExercisePerformedModel>>(null)
  const [addExercisePickerOpen, setAddExercisePickerOpen] = useState(false)
  const [replaceExercisePickerOpen, setReplaceExercisePickerOpen] = useState(false)
  const [replacingExerciseOrder, setReplacingExerciseOrder] = useState<number>()

  const onAddExerciseCallback = useCallback(
    (exercise: IExerciseModel) => {
      onAddExercise(exercise)
      // If scrollToEnd is called immediately, it could happen before the new exercise
      // is added to the list
      setTimeout(() => {
        exercisesRef.current?.scrollToEnd({ animated: true })
      }, 500)
      setAddExercisePickerOpen(false)
    },
    [exercisesRef],
  )

  const onReplaceExerciseCallback = useCallback(
    (exercise: IExerciseModel) => {
      if (replacingExerciseOrder === undefined) {
        logError(new Error("replacingExerciseOrder is not set"))
        useToastTx("common.error.unknownErrorMessage")
      } else {
        onReplaceExercise(replacingExerciseOrder, exercise)
        setReplaceExercisePickerOpen(false)
      }
    },
    [replacingExerciseOrder],
  )

  const renderItem = ({ item, drag, isActive }: RenderItemParams<IExercisePerformedModel>) => {
    return (
      <ScaleDecorator>
        <ExerciseEntry
          {...props}
          exercise={item}
          isPlaceholder={isActive}
          onExerciseNameLongPress={drag}
          onPressReplaceExercise={() => {
            console.debug(
              "onPressReplaceExercise called, setting replacingExerciseOrder to",
              item.exerciseOrder,
            )
            setReplacingExerciseOrder(item.exerciseOrder)
            setReplaceExercisePickerOpen(true)
          }}
        />
      </ScaleDecorator>
    )
  }

  // Note that if this function throws an error, it will result in a RN "non-std C++ exception" error
  // so just to be save, wrapping it in a try-catch block
  const onDragEnd = ({ from, to }) => {
    console.debug("WorkoutEditor.onDragEnd called", { from, to })
    try {
      onReorderExercise(from, to)
    } catch (e) {
      console.debug("WorkoutEditor.onDragEnd error:", e)
    }
  }

  return (
    <>
      <DraggableFlatList
        // debug={true}
        ref={exercisesRef as any}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        data={toJS(allExercises)} // toJS needed to work with DraggableFlatList
        extraData={allExercises.length} // This is needed to force a re-render when the data changes
        renderItem={renderItem}
        keyExtractor={(item) => `${item.exerciseId}_${item.exerciseOrder}`}
        onDragEnd={onDragEnd}
        autoscrollSpeed={150}
        ListHeaderComponent={
          <>
            {ExtraHeaderComponent && <ExtraHeaderComponent />}
            <TextField
              style={$exerciseNotesInputStyle}
              inputWrapperStyle={$exerciseNotesInputWrapper}
              multiline={true}
              value={workoutNotes ?? undefined}
              onChangeText={onChangeWorkoutNotes}
              placeholderTx="workoutEditor.workoutNotesPlaceholder"
            />
          </>
        }
        ListFooterComponent={
          <>
            <Button
              preset="text"
              tx="workoutEditor.addExerciseButtonLabel"
              onPress={() => setAddExercisePickerOpen(true)}
            />
            <Spacer type="vertical" size="massive" />
          </>
        }
      />

      {/* For adding exercises */}
      <ExercisePickerSheet
        open={addExercisePickerOpen}
        onOpenChange={setAddExercisePickerOpen}
        onItemPress={onAddExerciseCallback}
      />

      {/* For replacing exercises */}
      <ExercisePickerSheet
        open={replaceExercisePickerOpen}
        onOpenChange={setReplaceExercisePickerOpen}
        onItemPress={onReplaceExerciseCallback}
      />
    </>
  )
})

const $exerciseNotesInputWrapper: ViewStyle = {
  borderWidth: 0,
  minHeight: 12,
}

const $exerciseNotesInputStyle: ViewStyle = {
  marginHorizontal: spacing.tiny,
}
