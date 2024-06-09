import { Button, Spacer, TextField } from "app/components"
import { ExerciseSettings, ExerciseSettingsType } from "app/data/types"
import { IExerciseModel, IExercisePerformedModel, SetPropType } from "app/stores"
import { spacing } from "app/theme"
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

export type WorkoutEditorV2Props = {
  workoutNotes?: string | null
  onChangeWorkoutNotes: (value: string) => void
  allExercises: IExercisePerformedModel[]
  enableExerciseSettingsMenuItems?: Array<ExerciseSettingsType>
  onChangeExerciseSettings?: (
    exerciseId: string,
    settingItem: keyof ExerciseSettings,
    value: any,
  ) => void
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
  onCompleteSet?: (settings: { autoRestTimerEnabled: boolean; restTime: number }) => void
  onAddSet: (exerciseOrder: number) => void
  onRemoveSet: (exerciseOrder: number, setOrder: number) => void
  ExtraHeaderComponent?: React.JSXElementConstructor<any>
}

export const WorkoutEditor = observer((props: WorkoutEditorV2Props) => {
  const {
    workoutNotes,
    onChangeWorkoutNotes,
    allExercises,
    onAddExercise,
    onReorderExercise,
    ExtraHeaderComponent,
  } = props

  const exercisesRef = useRef<FlatList<IExercisePerformedModel>>(null)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)

  const handleExerciseSelected = useCallback(
    (exercise: IExerciseModel) => {
      onAddExercise(exercise)
      // If scrollToEnd is called immediately, it could happen before the new exercise
      // is added to the list
      setTimeout(() => {
        exercisesRef.current?.scrollToEnd({ animated: true })
      }, 500)
      setExercisePickerOpen(false)
    },
    [exercisesRef],
  )

  const renderItem = ({ item, drag, isActive }: RenderItemParams<IExercisePerformedModel>) => {
    return (
      <ScaleDecorator>
        <ExerciseEntry
          {...props}
          exercise={item}
          isPlaceholder={isActive}
          onExerciseNameLongPress={drag}
        />
      </ScaleDecorator>
    )
  }

  // Note that if this function throws an error, it will result in a RN "non-std C++ exception" error
  // so just to be save, wrapping it in a try-catch block
  const onDragEnd = ({ data, from, to }) => {
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
              onPress={() => setExercisePickerOpen(true)}
            />
            <Spacer type="vertical" size="massive" />
          </>
        }
      />
      <ExercisePickerSheet
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
        onItemPress={handleExerciseSelected}
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
