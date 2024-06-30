import {
  Button,
  Icon,
  Modal,
  RowView,
  Sheet,
  Spacer,
  Text,
  TextField,
  TimePicker,
} from "app/components"
import { ExerciseVolumeType } from "app/data/constants"
import {
  ExerciseSetPerformed,
  ExerciseSettings,
  RepsExerciseSetPerformed,
  TimeExerciseSetPerformed,
} from "app/data/types"
import { useSetFromLastWorkout, useWeight } from "app/hooks"
import { IExercisePerformedModel, ISetPerformedModel, SetPropType, useStores } from "app/stores"
import { spacing, styles, thresholds } from "app/theme"
import { roundToString } from "app/utils/formatNumber"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useRef, useState } from "react"
import { TextStyle, TouchableOpacity, View, ViewProps, ViewStyle } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { WorkoutEditorProps } from "./WorkoutEditor"

// RPE list 6 - 10
const rpeList: {
  label: string
  value: number
}[] = Array.from({ length: 9 }, (_, i) => {
  const rpe = 6 + 0.5 * i
  return {
    label: rpe.toString(),
    value: rpe,
  }
})

function isValidPrecision(value: string, decimalPlaces: number) {
  let isValid = true

  if (!value) isValid = false

  let regexPattern: string
  if (decimalPlaces > 0) {
    console.debug("isValidPrecision checking decimals:", decimalPlaces)
    regexPattern = `^(?!0\\d)([0-9]+(\\.|\\.[0-9]{1,${decimalPlaces}})?)?$`
  } else {
    console.debug("isValidPrecision checking integer")
    regexPattern = `^(?!0\\d)([0-9]+)?$`
  }
  const regex = new RegExp(regexPattern)
  if (!regex.test(value)) {
    console.debug("isValidPrecision regex failed:", regexPattern)
    isValid = false
  }

  // Failsafe
  if (!Number.isFinite(Number(value))) {
    console.debug("isValidPrecision not a finite number")
    isValid = false
  }

  console.debug("isValidPrecision return isValid", isValid)
  return isValid
}

export type SetSwipeableContainerProps = ViewProps &
  SetEntryProps & {
    setFromLastWorkout?: ExerciseSetPerformed
    renderPreviousSetText: ISetPerformedModel
    onPressPreviousSet: () => void
    onPressCompleteSet: () => void
  }

const SetSwipeableContainer: FC<SetSwipeableContainerProps> = (
  props: SetSwipeableContainerProps,
) => {
  const {
    exercise,
    set,
    setFromLastWorkout,
    renderPreviousSetText,
    onPressPreviousSet,
    onPressCompleteSet,
    onRemoveSet,
    disableSetCompletion,
  } = props
  const { exerciseOrder } = exercise
  const { setOrder, isCompleted } = set
  const { themeStore } = useStores()
  const swipeableRef = useRef<Swipeable>(null)

  function renderRightDelete() {
    const handleDelete = () => {
      swipeableRef.current?.close()
      onRemoveSet(exerciseOrder, setOrder)
    }

    const $swipeContainer: ViewStyle = {
      justifyContent: "center",
      marginTop: spacing.tiny,
      marginLeft: spacing.extraSmall,
    }

    const $deleteButton: ViewStyle = {
      backgroundColor: themeStore.colors("danger"),
      paddingHorizontal: spacing.small,
      paddingVertical: 0,
      minHeight: 40,
      height: 40,
    }

    return (
      <View style={$swipeContainer}>
        <Button style={$deleteButton} onPress={handleDelete} tx="common.delete" />
      </View>
    )
  }

  const $exerciseSetCompletion: ViewStyle = {
    backgroundColor:
      !disableSetCompletion && isCompleted
        ? themeStore.colors("lightTint")
        : themeStore.colors("background"),
  }

  const $previousSetText: TextStyle = {
    textAlign: "center",
    opacity: isCompleted ? 0.5 : 1,
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightDelete}
      rightThreshold={thresholds.swipeableRight}
    >
      <RowView style={[$exerciseSet, $exerciseSetCompletion]}>
        <Text text={(setOrder + 1).toString()} style={[$setOrderColumn, $textAlignCenter]} />
        <TouchableOpacity
          disabled={!setFromLastWorkout}
          onPress={onPressPreviousSet}
          style={$previousColumn}
        >
          <Text text={renderPreviousSetText()} size="xs" style={$previousSetText} />
        </TouchableOpacity>
        {props.children}
        {!disableSetCompletion && (
          <View style={[$isCompletedColumn, $textAlignCenter]}>
            {isCompleted ? (
              <Icon
                name="checkbox"
                color={themeStore.colors("foreground")}
                size={30}
                onPress={onPressCompleteSet}
              />
            ) : (
              <Icon
                name="checkbox-outline"
                color={themeStore.colors("foreground")}
                size={30}
                onPress={onPressCompleteSet}
              />
            )}
          </View>
        )}
      </RowView>
    </Swipeable>
  )
}

const TimeSetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const {
    exercise,
    exerciseSettings,
    set,
    onChangeSetValue,
    onCompleteSet,
    onRemoveSet,
    disableSetCompletion,
  } = props
  const { exerciseId } = exercise
  const { setOrder, isCompleted } = set

  const { themeStore } = useStores()

  // Set from previous workout
  const [setFromLastWorkout] = useSetFromLastWorkout<TimeExerciseSetPerformed>(exerciseId, setOrder)

  // Exercise properties and settings
  const { autoRestTimerEnabled, restTime } = exerciseSettings

  // States
  const [time, setTime] = useState(set.time)
  const [timeInput, setTimeInput] = useState(set.time)
  const [isNullTime, setIsNullTime] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)

  useEffect(() => {
    if (time) {
      updateSetProp(SetPropType.Time, time)
    }
  }, [time])

  function updateSetProp(prop: SetPropType, value: number | null) {
    onChangeSetValue(exercise.exerciseOrder, set.setOrder, prop, value)
  }

  function updateSetIsCompleted(isCompleted: boolean) {
    onChangeSetValue(exercise.exerciseOrder, set.setOrder, "isCompleted", isCompleted)
    isCompleted && onCompleteSet && onCompleteSet({ autoRestTimerEnabled, restTime })
  }

  const renderPreviousSetText = () => {
    if (!setFromLastWorkout || !setFromLastWorkout.time) return "-"
    return formatSecondsAsTime(setFromLastWorkout.time)
  }

  const copyPreviousSet = () => {
    if (!setFromLastWorkout || isCompleted) return

    setTime(setFromLastWorkout.time ?? null)
  }

  const updateTime = () => {
    if (timeInput) setTime(timeInput)
    else setTime(null)
  }

  function toggleSetStatus() {
    if (set.isCompleted) {
      updateSetIsCompleted(false)
      return
    }

    if (!time || time === 0) {
      setIsNullTime(true)
      return
    }

    // Make sure to mark complete before restarting the rest timer
    // so that the last completed set can be identified and used for notification
    setIsNullTime(false)
    updateSetIsCompleted(true)
  }

  const $timeColumn: ViewStyle = {
    flex: 3,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: set.isCompleted ? undefined : 1,
    borderRadius: 4,
    borderColor: isNullTime ? themeStore.colors("error") : themeStore.colors("border"),
    opacity: isCompleted ? 0.5 : 1,
  }

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeInput}
        onRequestClose={() => setShowTimeInput(false)}
      >
        <Text tx="workoutEditor.exerciseSetHeaders.time" preset="formHelper" />
        <TimePicker initialValue={timeInput ?? 0} onValueChange={setTimeInput} />
        <Spacer type="vertical" size="medium" />
        <RowView style={styles.justifyCenter}>
          <Button
            preset="text"
            textStyle={{ color: themeStore.colors("text") }}
            tx="common.cancel"
            onPress={() => setShowTimeInput(false)}
          />
          <Spacer type="horizontal" size="massive" />
          <Button
            preset="text"
            tx="common.ok"
            onPress={() => {
              updateTime()
              setShowTimeInput(false)
            }}
          />
        </RowView>
      </Modal>
      <SetSwipeableContainer
        exercise={exercise}
        exerciseSettings={exerciseSettings}
        set={set}
        setFromLastWorkout={setFromLastWorkout ?? undefined}
        renderPreviousSetText={renderPreviousSetText}
        onPressPreviousSet={copyPreviousSet}
        onPressCompleteSet={toggleSetStatus}
        onRemoveSet={onRemoveSet}
        onChangeSetValue={onChangeSetValue}
        onCompleteSet={onCompleteSet}
        disableSetCompletion={disableSetCompletion}
      >
        <TouchableOpacity
          disabled={!disableSetCompletion && set.isCompleted}
          style={$timeColumn}
          onPress={() => setShowTimeInput(true)}
        >
          <Text>{time && formatSecondsAsTime(time)}</Text>
        </TouchableOpacity>
      </SetSwipeableContainer>
    </>
  )
})

const RepsSetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const {
    exercise,
    exerciseSettings,
    set,
    onChangeSetValue,
    onCompleteSet,
    onRemoveSet,
    disableSetCompletion,
  } = props
  const { exerciseId } = exercise
  const { setOrder, isCompleted } = set

  const { themeStore } = useStores()

  // Set from previous workout
  const [setFromLastWorkout] = useSetFromLastWorkout<RepsExerciseSetPerformed>(exerciseId, setOrder)

  // Exercise properties and settings
  const { autoRestTimerEnabled, restTime, weightUnit } = exerciseSettings

  // States
  const [isNullReps, setIsNullReps] = useState(false)
  // Weight is always converted and stored in kg,
  // but depending on user preference will display as kg or lbs (using displayWeight).
  // Input state and actual weight state are separate to allow for input validation
  const [displayWeight, weightKg, setDisplayWeight, setDisplayUnit] = useWeight(
    set.weight,
    weightUnit,
  )
  const [reps, setReps] = useState(set.reps)
  const [rpe, setRpe] = useState(set.rpe)
  const [weightInput, setWeightInput] = useState(
    displayWeight ? roundToString(displayWeight, 2, false) : undefined,
  )
  const [repsInput, setRepsInput] = useState(reps?.toString())
  const [openRpeSelector, setOpenRpeSelector] = useState(false)

  useEffect(() => {
    setWeightInput(displayWeight ? roundToString(displayWeight, 2, false) : undefined)
  }, [displayWeight])

  useEffect(() => {
    setDisplayUnit(weightUnit)
  }, [weightUnit])

  useEffect(() => {
    updateSetStore()
  }, [weightKg, reps, rpe])

  function updateSetProp(prop: SetPropType, value: number | null) {
    onChangeSetValue(exercise.exerciseOrder, set.setOrder, prop, value)
  }

  function updateSetIsCompleted(isCompleted: boolean) {
    onChangeSetValue(exercise.exerciseOrder, set.setOrder, "isCompleted", isCompleted)
    isCompleted && onCompleteSet && onCompleteSet({ autoRestTimerEnabled, restTime })
  }

  function updateSetStore() {
    updateSetProp(SetPropType.Weight, weightKg ?? null)
    updateSetProp(SetPropType.Reps, reps ?? null)
    updateSetProp(SetPropType.RPE, rpe ?? null)
  }

  function toggleSetStatus() {
    if (set.isCompleted) {
      updateSetIsCompleted(false)
      return
    }

    if (!reps || reps === 0) {
      setIsNullReps(true)
      return
    }

    setIsNullReps(false)
    updateSetStore()

    // Make sure to mark complete before restarting the rest timer
    // so that the last completed set can be identified and used for notification
    updateSetIsCompleted(true)
  }

  function handleWeightChangeText(value: string | null) {
    if (!value) {
      setWeightInput(undefined)
      return
    }

    if (isValidPrecision(value, 2)) {
      setWeightInput(value)
      setDisplayWeight(parseFloat(value))
    }
  }

  function handleRepsChangeText(value: string | null) {
    if (!value) {
      setRepsInput(undefined)
      return
    }

    if (isValidPrecision(value, 0)) {
      setRepsInput(value)
      setReps(parseInt(value))
    }
  }

  function onRpeChange(value: number | null) {
    setRpe(value)
    setOpenRpeSelector(false)
  }

  const renderPreviousSetText = () => {
    // If the reps is 0, probably the volume type switched from Time to Reps
    // and reps 0 was used to save the previous Time set, we need to ignore it
    if (!setFromLastWorkout || !setFromLastWorkout.reps) return "-"

    const prevWeight = new Weight(setFromLastWorkout.weight)

    let prevSet = `${roundToString(
      prevWeight.getWeightInUnit(weightUnit) ?? 0,
      1,
    )} ${weightUnit} x ${setFromLastWorkout.reps}`
    if (setFromLastWorkout.rpe) {
      prevSet += ` @ ${setFromLastWorkout.rpe}`
    }

    return prevSet
  }

  const copyPreviousSet = () => {
    if (!setFromLastWorkout || isCompleted) return

    // RPE will not be copied as it should be set by the user
    // If weight was null in the previous set, ignore it as well
    if (setFromLastWorkout.weight) {
      const prevWeight = new Weight(setFromLastWorkout.weight)
      handleWeightChangeText(roundToString(prevWeight.getWeightInUnit(weightUnit) ?? 0, 2, false))
    }
    handleRepsChangeText(roundToString(setFromLastWorkout.reps ?? 0, 0, false))
  }

  const $rpeInput: ViewStyle = {
    flex: 2,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.tiny,
    borderWidth: isCompleted ? undefined : 1,
    borderRadius: 4,
    borderColor: themeStore.colors("border"),
    opacity: isCompleted ? 0.5 : 1,
  }

  const $rpeSelectorItems: ViewStyle = {
    minWidth: 50,
    minHeight: 35,
    borderRadius: 8,
    backgroundColor: themeStore.colors("contentBackground"),
    alignItems: "center",
    justifyContent: "center",
  }

  return (
    <>
      <SetSwipeableContainer
        exercise={exercise}
        exerciseSettings={exerciseSettings}
        set={set}
        setFromLastWorkout={setFromLastWorkout ?? undefined}
        renderPreviousSetText={renderPreviousSetText}
        onPressPreviousSet={copyPreviousSet}
        onPressCompleteSet={toggleSetStatus}
        onRemoveSet={onRemoveSet}
        onChangeSetValue={onChangeSetValue}
        onCompleteSet={onCompleteSet}
        disableSetCompletion={disableSetCompletion}
      >
        <TextField
          status={!disableSetCompletion && set.isCompleted ? "disabled" : null}
          textAlignVertical="center"
          value={weightInput ?? ""}
          onChangeText={handleWeightChangeText}
          containerStyle={$weightInput}
          inputWrapperStyle={$textFieldWrapper}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          inputMode="decimal"
          maxLength={7}
        />
        <TextField
          status={
            isNullReps ? "error" : !disableSetCompletion && set.isCompleted ? "disabled" : null
          }
          textAlignVertical="center"
          value={repsInput ?? ""}
          onChangeText={handleRepsChangeText}
          containerStyle={$repsInput}
          inputWrapperStyle={$textFieldWrapper}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          inputMode="numeric"
          maxLength={3}
        />
        <TouchableOpacity style={$rpeInput} onPress={() => setOpenRpeSelector(true)}>
          <Text>{rpe}</Text>
        </TouchableOpacity>
      </SetSwipeableContainer>

      <Sheet
        open={openRpeSelector}
        onOpenChange={setOpenRpeSelector}
        snapPoints={[30]}
        snapPointsMode={"percent"}
      >
        <View style={$rpeSelectorContainer}>
          <RowView style={[styles.alignCenter, styles.justifyBetween]}>
            <Text tx="workoutEditor.selectRpeLabel" />
            <Button preset="text" tx="common.clear" onPress={() => onRpeChange(null)} />
          </RowView>
          <Spacer type="vertical" size="small" />
          <RowView style={$rpeItemsFullSteps}>
            {rpeList.map(
              (rpeItem, index) =>
                index % 2 === 0 && (
                  <TouchableOpacity
                    key={"rpe_" + index}
                    style={$rpeSelectorItems}
                    onPress={() => onRpeChange(rpeItem.value)}
                  >
                    <Text>{rpeItem.label}</Text>
                  </TouchableOpacity>
                ),
            )}
          </RowView>
          <Spacer type="vertical" size="small" />
          <RowView style={$rpeItemsFullSteps}>
            {rpeList.map(
              (rpeItem, index) =>
                index % 2 !== 0 && (
                  <TouchableOpacity
                    key={"rpe_" + index}
                    style={$rpeSelectorItems}
                    onPress={() => onRpeChange(rpeItem.value)}
                  >
                    <Text>{rpeItem.label}</Text>
                  </TouchableOpacity>
                ),
            )}
          </RowView>
          <Spacer type="vertical" size="small" />
          <Button tx="common.back" onPress={() => setOpenRpeSelector(false)} />
        </View>
      </Sheet>
    </>
  )
})

const $rpeSelectorContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.screenPadding,
  marginBottom: spacing.screenPadding,
}

const $rpeItemsFullSteps: ViewStyle = {
  gap: spacing.large,
  marginHorizontal: "auto",
}

export type SetEntryProps = Pick<
  WorkoutEditorProps,
  "onChangeSetValue" | "onRemoveSet" | "onCompleteSet" | "disableSetCompletion"
> & {
  exercise: IExercisePerformedModel
  set: ISetPerformedModel
  exerciseSettings: Required<ExerciseSettings>
}

export const SetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  // When we remove incomplete sets before submitting the workout,
  // it is possible that the exerciseOrder + setOrder combination was incomplete and destroyed.
  // The SetEntry component will yet to be removed from the UI,
  // and will throw an error when trying to access the destroyed set,
  // so we need to check if the set still exists before rendering.
  const volumeType = props.exercise.volumeType

  switch (volumeType) {
    case ExerciseVolumeType.Reps:
      return <RepsSetEntry {...props} />
    case ExerciseVolumeType.Time:
      return <TimeSetEntry {...props} />
  }
})

const $setOrderColumn: ViewStyle = {
  flex: 1,
}

const $previousColumn: ViewStyle = {
  flex: 2,
  paddingHorizontal: spacing.tiny,
}

const $weightInput: ViewStyle = {
  flex: 2,
  alignItems: "center",
  paddingHorizontal: spacing.tiny,
}

const $repsInput: ViewStyle = {
  flex: 2,
  alignItems: "center",
  paddingHorizontal: spacing.tiny,
}

const $isCompletedColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $textAlignCenter: TextStyle = {
  textAlign: "center",
}

const $exerciseSet: ViewStyle = {
  justifyContent: "space-around",
  alignItems: "center",
  marginTop: spacing.tiny,
  height: 42,
}

const $textFieldWrapper: ViewStyle = {
  height: "100%",
  width: "100%",
  backgroundColor: undefined,
}
