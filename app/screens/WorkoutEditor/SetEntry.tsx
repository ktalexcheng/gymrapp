import {
  Button,
  Icon,
  Modal,
  PickerModal,
  RowView,
  Spacer,
  Text,
  TextField,
  TimePicker,
} from "app/components"
import { ExerciseVolumeType, WeightUnit } from "app/data/constants"
import {
  ExerciseSetPerformed,
  RepsExerciseSetPerformed,
  TimeExerciseSetPerformed,
} from "app/data/types"
import { useExerciseSetting, useSetFromLastWorkout, useWeight } from "app/hooks"
import { translate } from "app/i18n"
import { RepsSetPerformedModel, TimeSetPerformedModel } from "app/stores"
import { roundToString } from "app/utils/formatNumber"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import { Instance } from "mobx-state-tree"
import React, { FC, useEffect, useState } from "react"
import { TextStyle, TouchableOpacity, View, ViewProps, ViewStyle } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { useStores } from "../../stores"
import { spacing, styles, thresholds } from "../../theme"

// RPE list 6 - 10
const rpeList: {
  label: string
  value: string | null
}[] = Array.from({ length: 9 }, (_, i) => {
  const rpe = 6 + 0.5 * i
  return {
    label: rpe.toString(),
    value: rpe.toString(),
  }
})
// Using empty string as the first item in the list to allow for clearing the dropdown
rpeList.unshift({ label: translate("activeWorkoutScreen.rpeNullLabel"), value: null })

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

interface SetSwipeableContainerProps extends ViewProps {
  mode: "active" | "editor"
  exerciseOrder: number
  setOrder: number
  isCompleted: boolean
  setFromLastWorkout?: ExerciseSetPerformed
  renderPreviousSetText: () => string
  onPressPreviousSet: () => void
  onPressCompleteSet: () => void
}

const SetSwipeableContainer: FC<SetSwipeableContainerProps> = (
  props: SetSwipeableContainerProps,
) => {
  const {
    mode,
    exerciseOrder,
    setOrder,
    isCompleted,
    setFromLastWorkout,
    renderPreviousSetText,
    onPressPreviousSet,
    onPressCompleteSet,
  } = props
  const { activeWorkoutStore, workoutEditorStore, themeStore } = useStores()
  const workoutStore = mode === "active" ? activeWorkoutStore : workoutEditorStore
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder)?.setsPerformed?.[setOrder]

  function renderRightDelete() {
    const handleDelete = () => {
      workoutStore.removeSet(exerciseOrder, setOrder)
    }

    const $swipeContainer: ViewStyle = {
      justifyContent: "center",
      marginTop: spacing.tiny,
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
    backgroundColor: isCompleted ? themeStore.colors("lightTint") : themeStore.colors("background"),
  }

  return (
    <Swipeable renderRightActions={renderRightDelete} rightThreshold={thresholds.swipeableRight}>
      <RowView style={[$exerciseSet, $exerciseSetCompletion]}>
        <Text text={(props.setOrder + 1).toString()} style={[$setOrderColumn, $textAlignCenter]} />
        <TouchableOpacity
          disabled={!setFromLastWorkout}
          onPress={onPressPreviousSet}
          style={$previousColumn}
        >
          <Text text={renderPreviousSetText()} size="xs" style={$previousSetText} />
        </TouchableOpacity>
        {props.children}
        <View style={[$isCompletedColumn, $textAlignCenter]}>
          {exerciseSetStore?.isCompleted ? (
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
      </RowView>
    </Swipeable>
  )
}

const TimeSetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const { mode, exerciseId, exerciseOrder, setOrder } = props
  const { activeWorkoutStore, workoutEditorStore, themeStore } = useStores()
  const isActiveWorkout = mode === "active"
  const workoutStore = isActiveWorkout ? activeWorkoutStore : workoutEditorStore

  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder)?.setsPerformed?.[
    setOrder
  ] as Instance<typeof TimeSetPerformedModel>

  // Set from previous workout
  const [setFromLastWorkout] = useSetFromLastWorkout<TimeExerciseSetPerformed>(exerciseId, setOrder)

  // Exercise properties and settings
  const [autoRestTimerEnabled] = useExerciseSetting<number>(exerciseId, "autoRestTimerEnabled")
  const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")

  // States
  const [time, setTime] = useState(exerciseSetStore?.time)
  const [timeInput, setTimeInput] = useState(exerciseSetStore?.time)
  const [isNullTime, setIsNullTime] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)

  useEffect(() => {
    if (time) {
      exerciseSetStore?.updateSetValues("time", time)
    }
  }, [time])

  const renderPreviousSetText = () => {
    if (!setFromLastWorkout || !setFromLastWorkout.time) return "-"
    return formatSecondsAsTime(setFromLastWorkout.time)
  }

  const copyPreviousSet = () => {
    if (!setFromLastWorkout) return

    setTime(setFromLastWorkout.time ?? null)
  }

  const updateTime = () => {
    if (timeInput) setTime(timeInput)
    else setTime(null)
  }

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", false)
      return
    }

    if (!time || time === 0) {
      setIsNullTime(true)
      return
    }

    // Make sure to mark complete before restarting the rest timer
    // so that the last completed set can be identified and used for notification
    setIsNullTime(false)
    exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)

    if (isActiveWorkout && autoRestTimerEnabled) {
      workoutStore.restartRestTimer(restTimeSetting)
    }
  }

  const $timeColumn: ViewStyle = {
    flex: 3,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: exerciseSetStore.isCompleted ? undefined : 1,
    borderRadius: 4,
    borderColor: isNullTime ? themeStore.colors("error") : themeStore.colors("border"),
  }
  console.debug("TimeSetEntry time", time)
  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeInput}
        onRequestClose={() => setShowTimeInput(false)}
      >
        <Text tx="activeWorkoutScreen.enterTimeLabel" preset="formHelper" />
        <TimePicker initialValue={timeInput ?? 0} onValueChange={setTimeInput} />
        <Spacer type="vertical" size="medium" />
        <RowView style={styles.justifyCenter}>
          <Button
            preset="text"
            tx="common.ok"
            onPress={() => {
              updateTime()
              setShowTimeInput(false)
            }}
          />
          <Spacer type="horizontal" size="small" />
          <Button preset="text" tx="common.cancel" onPress={() => setShowTimeInput(false)} />
        </RowView>
      </Modal>
      <SetSwipeableContainer
        mode={mode}
        exerciseOrder={exerciseOrder}
        setOrder={setOrder}
        isCompleted={exerciseSetStore.isCompleted}
        setFromLastWorkout={setFromLastWorkout ?? undefined}
        renderPreviousSetText={renderPreviousSetText}
        onPressPreviousSet={copyPreviousSet}
        onPressCompleteSet={toggleSetStatus}
      >
        <TouchableOpacity
          disabled={exerciseSetStore.isCompleted}
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
  const { mode } = props
  const { activeWorkoutStore, workoutEditorStore, themeStore } = useStores()
  const isActiveWorkout = mode === "active"
  const workoutStore = isActiveWorkout ? activeWorkoutStore : workoutEditorStore
  const { exerciseId, exerciseOrder, setOrder } = props

  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder)?.setsPerformed?.[
    setOrder
  ] as Instance<typeof RepsSetPerformedModel>

  // Set from previous workout
  const [setFromLastWorkout] = useSetFromLastWorkout<RepsExerciseSetPerformed>(exerciseId, setOrder)

  // Exercise properties and settings
  const [autoRestTimerEnabled] = useExerciseSetting<number>(exerciseId, "autoRestTimerEnabled")
  const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")
  const [weightUnitSetting] = useExerciseSetting<WeightUnit>(exerciseId, "weightUnit")

  // States
  const [isNullReps, setIsNullReps] = useState(false)
  // Weight is always converted and stored in kg,
  // but depending on user preference will display as kg or lbs (using displayWeight).
  // Input state and actual weight state are separate to allow for input validation
  const [displayWeight, weightKg, setDisplayWeight, setDisplayUnit] = useWeight(
    exerciseSetStore.weight,
    weightUnitSetting,
  )
  const [reps, setReps] = useState(exerciseSetStore.reps)
  const [rpe, setRpe] = useState(exerciseSetStore.rpe)
  const [weightInput, setWeightInput] = useState(
    displayWeight ? roundToString(displayWeight, 2, false) : undefined,
  )
  const [repsInput, setRepsInput] = useState(reps?.toString())
  const [rpeInput, setRpeInput] = useState(rpe?.toString())

  useEffect(() => {
    setDisplayUnit(weightUnitSetting)
  }, [weightUnitSetting])

  useEffect(() => {
    updateSetStore()
  }, [displayWeight, reps, rpe])

  function updateSetStore() {
    console.debug("RepsSetEntry updateSetStore", { weightKg, reps, rpe })
    exerciseSetStore.updateSetValues("weight", weightKg ?? null)
    exerciseSetStore.updateSetValues("reps", reps ?? null)
    exerciseSetStore.updateSetValues("rpe", rpe ?? null)
  }

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", false)
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
    exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)

    if (isActiveWorkout && autoRestTimerEnabled) {
      workoutStore.restartRestTimer(restTimeSetting)
    }
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

  function handleRpeChangeText(value: string) {
    if (!value) {
      // Must set to empty string, a null or undefined will not clear the dropdown
      setRpeInput("")
      return
    }

    if (isValidPrecision(value, 1)) {
      const num = Number(value)
      if (num >= 6 && num <= 10) {
        setRpeInput(value)
        setRpe(parseFloat(value))
      }
    }
  }

  const renderPreviousSetText = () => {
    if (!setFromLastWorkout) return "-"

    const prevWeight = new Weight(setFromLastWorkout.weight ?? 0, WeightUnit.kg, weightUnitSetting)

    let prevSet = `${prevWeight.formattedDisplayWeight(1)} ${weightUnitSetting} x ${
      setFromLastWorkout.reps
    }`
    if (setFromLastWorkout.rpe) {
      prevSet += ` @ ${setFromLastWorkout.rpe}`
    }

    return prevSet
  }

  const copyPreviousSet = () => {
    if (!setFromLastWorkout) return

    // RPE will not be copied as it should be set by the user
    // If weight was null in the previous set, ignore it as well
    if (setFromLastWorkout.weight) {
      const prevWeight = new Weight(setFromLastWorkout.weight, WeightUnit.kg, weightUnitSetting)
      handleWeightChangeText(prevWeight.formattedDisplayWeight(2, false))
    }
    handleRepsChangeText(roundToString(setFromLastWorkout.reps ?? 0, 0, false))
  }

  return (
    <SetSwipeableContainer
      mode={mode}
      exerciseOrder={exerciseOrder}
      setOrder={setOrder}
      isCompleted={exerciseSetStore.isCompleted}
      setFromLastWorkout={setFromLastWorkout ?? undefined}
      renderPreviousSetText={renderPreviousSetText}
      onPressPreviousSet={copyPreviousSet}
      onPressCompleteSet={toggleSetStatus}
    >
      <View style={$weightColumn}>
        <TextField
          // status={isNullWeight ? "error" : null}
          status={exerciseSetStore.isCompleted ? "disabled" : null}
          style={{ color: themeStore.colors("text") }}
          textAlignVertical="center"
          value={weightInput ?? ""}
          onChangeText={handleWeightChangeText}
          inputWrapperStyle={$textFieldWrapper}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          inputMode="numeric"
          maxLength={7}
        />
      </View>
      <View style={$repsColumn}>
        <TextField
          status={isNullReps ? "error" : exerciseSetStore.isCompleted ? "disabled" : null}
          style={{ color: themeStore.colors("text") }}
          textAlignVertical="center"
          value={repsInput ?? ""}
          onChangeText={handleRepsChangeText}
          inputWrapperStyle={$textFieldWrapper}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          maxLength={3}
        />
      </View>
      <View style={$rpeColumn}>
        <PickerModal
          disabled={exerciseSetStore.isCompleted}
          value={rpeInput}
          onChange={handleRpeChangeText}
          itemsList={rpeList}
          modalTitleTx="activeWorkoutScreen.rpeColumnHeader"
          wrapperStyle={$textFieldWrapper}
        />
      </View>
    </SetSwipeableContainer>
  )
})

export type SetEntryProps = {
  mode: "active" | "editor"
  exerciseOrder: number
  exerciseId: string
  setOrder: number
  volumeType: ExerciseVolumeType
  // setType: string
  // isCompleted: boolean
  // weight: number
  // reps: number
}

export const SetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  // When we remove incomplete sets before submitting the workout,
  // it is possible that the exerciseOrder + setOrder combination was incomplete and destroyed.
  // The SetEntry component will yet to be removed from the UI,
  // and will throw an error when trying to access the destroyed set,
  // so we need to check if the set still exists before rendering.
  const { mode } = props
  const { activeWorkoutStore, workoutEditorStore } = useStores()
  const workoutStore = mode === "active" ? activeWorkoutStore : workoutEditorStore
  const thisSet = workoutStore.exercises.at(props.exerciseOrder)?.setsPerformed?.[props.setOrder]
  if (!thisSet) return null

  switch (props.volumeType) {
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

const $weightColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
  paddingHorizontal: spacing.tiny,
}

const $repsColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
  paddingHorizontal: spacing.tiny,
}

const $rpeColumn: ViewStyle = {
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

const $previousSetText: TextStyle = {
  textAlign: "center",
}
