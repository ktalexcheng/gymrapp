import { ExerciseVolumeType, WeightUnit } from "app/data/constants"
import { ExerciseSet, RepsExerciseSet, TimeExerciseSet } from "app/data/model"
import { useWeight } from "app/hooks"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
import { translate } from "app/i18n"
import { roundToString } from "app/utils/formatNumber"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import {
  Modal,
  TextStyle,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
  useWindowDimensions,
} from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { Button, Dropdown, Icon, RowView, Spacer, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing, styles, thresholds } from "../../theme"

// RPE list 6 - 10
const rpeList = Array.from({ length: 9 }, (_, i) => {
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
  exerciseOrder: number
  setOrder: number
  isCompleted: boolean
  setFromLastWorkout?: ExerciseSet
  renderPreviousSetText: () => string
  onPressPreviousSet: () => void
  onPressCompleteSet: () => void
}

const SetSwipeableContainer: FC<SetSwipeableContainerProps> = (
  props: SetSwipeableContainerProps,
) => {
  const {
    exerciseOrder,
    setOrder,
    isCompleted,
    setFromLastWorkout,
    renderPreviousSetText,
    onPressPreviousSet,
    onPressCompleteSet,
  } = props
  const { workoutStore } = useStores()
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder).setsPerformed[setOrder]

  function renderRightDelete() {
    const handleDelete = () => {
      workoutStore.removeSet(exerciseOrder, setOrder)
    }

    const $swipeContainer: ViewStyle = {
      justifyContent: "center",
      marginTop: spacing.tiny,
    }

    const $deleteButton: ViewStyle = {
      backgroundColor: colors.danger,
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
    backgroundColor: isCompleted ? colors.success : colors.background,
  }

  return (
    <Swipeable renderRightActions={renderRightDelete} rightThreshold={thresholds.swipeableRight}>
      <RowView style={[$exerciseSet, $exerciseSetCompletion]}>
        <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
        <TouchableOpacity
          disabled={!setFromLastWorkout}
          onPress={onPressPreviousSet}
          style={$previousColumn}
        >
          <Text text={renderPreviousSetText()} style={$textAlignCenter} />
        </TouchableOpacity>
        {props.children}
        <View style={[$isCompletedColumn, $textAlignCenter]}>
          {exerciseSetStore.isCompleted ? (
            <Icon name="checkbox" color="black" size={30} onPress={onPressCompleteSet} />
          ) : (
            <Icon name="checkbox-outline" color="black" size={30} onPress={onPressCompleteSet} />
          )}
        </View>
      </RowView>
    </Swipeable>
  )
}

const TimeSetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const { exerciseId, exerciseOrder, setOrder } = props
  const { workoutStore, userStore, feedStore } = useStores()

  // TODO: Create custom hook for getting previous set
  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder).setsPerformed[setOrder]

  // Set from previous workout
  const lastWorkoutId = userStore.getExerciseLastWorkoutId(exerciseId)
  const setFromLastWorkout =
    lastWorkoutId &&
    (feedStore.getSetFromWorkout(lastWorkoutId, exerciseId, setOrder) as TimeExerciseSet)

  // Exercise properties and settings
  const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")

  // States
  const [time, setTime] = useState<number>(exerciseSetStore.time)
  const [timeMinutesInput, setTimeMinutesInput] = useState<string>("")
  const [timeSecondsInput, setTimeSecondsInput] = useState<string>("")
  const [isNullTime, setIsNullTime] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)
  const { height: windowHeight, width: windowWidth } = useWindowDimensions()

  useEffect(() => {
    if (time) {
      exerciseSetStore.updateSetValues("time", time)
      setTimeMinutesInput(Math.floor(time / 60).toString())
      setTimeSecondsInput((time % 60).toString())
    }
  }, [time])

  const renderPreviousSetText = () => {
    if (!setFromLastWorkout) return "-"
    return formatSecondsAsTime(setFromLastWorkout.time)
  }

  const copyPreviousSet = () => {
    if (!setFromLastWorkout) return

    setTime(setFromLastWorkout.time)
  }

  const updateTime = () => {
    console.debug("updateTime timeMinutesInput", parseInt(timeMinutesInput ?? "0"))
    console.debug("updateTime timeSecondsInput", parseInt(timeSecondsInput) ?? 0)
    let seconds = timeMinutesInput ? parseInt(timeMinutesInput) * 60 : 0
    seconds += timeSecondsInput ? parseInt(timeSecondsInput) : 0

    if (!seconds) {
      setTime(undefined)
    } else {
      setTime(seconds)
    }
  }

  const handleTimeChangeText = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string,
    maxValue: number,
  ) => {
    if (!value) {
      setter(null)
      return
    }

    if (!isValidPrecision(value, 0)) {
      return
    }

    if (parseInt(value) > maxValue) {
      setter(maxValue.toString())
      return
    }

    setter(value)
  }

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", false)
      return
    }

    if (!time) {
      setIsNullTime(true)
      return
    }

    workoutStore.restartRestTimer(restTimeSetting)
    exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
    setIsNullTime(false)
  }

  const $timeInputModalContainer: ViewStyle = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  }

  const $timeInputModal: ViewStyle = {
    width: windowWidth * 0.7,
    height: windowHeight * 0.2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.contentBackground,
  }

  const $timeInputTextField: ViewStyle = {
    minWidth: 60,
  }

  const $timeColumn: ViewStyle = {
    flex: 3,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: isNullTime ? colors.error : colors.border,
  }

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeInput}
        onRequestClose={() => setShowTimeInput(false)}
      >
        <View style={$timeInputModalContainer}>
          <View style={$timeInputModal}>
            <Text tx="activeWorkoutScreen.enterTimeLabel" preset="formHelper" />
            <RowView style={styles.alignCenter}>
              <TextField
                containerStyle={$timeInputTextField}
                textAlign="center"
                value={timeMinutesInput}
                onChangeText={(value) => handleTimeChangeText(setTimeMinutesInput, value, 99)}
                onBlur={() => {
                  if (timeMinutesInput && !timeSecondsInput) setTimeSecondsInput("00")
                }}
              />
              <Text text=":" />
              <TextField
                containerStyle={$timeInputTextField}
                textAlign="center"
                value={timeSecondsInput}
                onChangeText={(value) => handleTimeChangeText(setTimeSecondsInput, value, 59)}
                onBlur={() => {
                  if (timeSecondsInput === "0") setTimeSecondsInput("00")
                }}
              />
            </RowView>
            <Spacer type="vertical" size="medium" />
            <RowView>
              <Button
                tx="common.ok"
                onPress={() => {
                  updateTime()
                  setShowTimeInput(false)
                }}
              />
              <Spacer type="horizontal" size="small" />
              <Button tx="common.cancel" onPress={() => setShowTimeInput(false)} />
            </RowView>
          </View>
        </View>
      </Modal>
      <SetSwipeableContainer
        exerciseOrder={exerciseOrder}
        setOrder={setOrder}
        isCompleted={exerciseSetStore.isCompleted}
        renderPreviousSetText={renderPreviousSetText}
        onPressPreviousSet={copyPreviousSet}
        onPressCompleteSet={toggleSetStatus}
      >
        <TouchableOpacity style={$timeColumn} onPress={() => setShowTimeInput(true)}>
          <Text>{time && formatSecondsAsTime(time)}</Text>
        </TouchableOpacity>
      </SetSwipeableContainer>
    </>
  )
})

const RepsSetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const { workoutStore, userStore, feedStore } = useStores()
  const { exerciseId, exerciseOrder, setOrder } = props

  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder).setsPerformed[setOrder]

  // Set from previous workout
  const lastWorkoutId = userStore.getExerciseLastWorkoutId(exerciseId)
  const setFromLastWorkout =
    lastWorkoutId &&
    (feedStore.getSetFromWorkout(lastWorkoutId, exerciseId, setOrder) as RepsExerciseSet)

  // Exercise properties and settings
  const [restTimeSetting] = useExerciseSetting<number>(exerciseId, "restTime")
  const [weightUnitSetting] = useExerciseSetting<WeightUnit>(exerciseId, "weightUnit")

  // States
  const [isNullWeight, setIsNullWeight] = useState(false)
  const [isNullReps, setIsNullReps] = useState(false)
  // Weight is always converted and stored in kg,
  // but depending on user preference will display as kg or lbs (using displayWeight).
  // Input state and actual weight state are separate to allow for input validation
  const [displayWeight, weightKg, setDisplayWeight, setDisplayUnit] = useWeight(
    exerciseSetStore.weight,
    weightUnitSetting,
  )
  const [reps, setReps] = useState<number>(exerciseSetStore.reps)
  const [rpe, setRpe] = useState<number>(exerciseSetStore.rpe)
  const [weightInput, setWeightInput] = useState<string>("")
  const [repsInput, setRepsInput] = useState<string>("")
  const [rpeInput, setRpeInput] = useState<string>("")

  useEffect(() => {
    setDisplayUnit(weightUnitSetting)
  }, [weightUnitSetting])

  useEffect(() => {
    updateSetStore()
    setWeightInput(roundToString(displayWeight, 2, false))
    setRepsInput(reps?.toString())
    setRpeInput(rpe?.toString())
  }, [displayWeight, reps, rpe])

  function updateSetStore() {
    exerciseSetStore.updateSetValues("weight", weightKg)
    exerciseSetStore.updateSetValues("reps", reps)
    exerciseSetStore.updateSetValues("rpe", rpe ?? null)
  }

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", false)
      return
    }

    if (weightKg && reps) {
      setIsNullWeight(false)
      setIsNullReps(false)
      updateSetStore()
      workoutStore.restartRestTimer(restTimeSetting)
      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
    } else {
      setIsNullWeight(!displayWeight)
      setIsNullReps(!reps)
    }
  }

  function handleWeightChangeText(value: string) {
    if (!value) {
      setWeightInput(null)
      return
    }

    if (isValidPrecision(value, 2)) {
      setWeightInput(value)
      setDisplayWeight(parseFloat(value))
    }
  }

  function handleRepsChangeText(value: string) {
    if (!value) {
      setRepsInput(null)
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

    const prevWeight = new Weight(setFromLastWorkout.weight, WeightUnit.kg, weightUnitSetting)

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
    handleWeightChangeText(roundToString(setFromLastWorkout.weight, 2, false))
    handleRepsChangeText(roundToString(setFromLastWorkout.reps, 0, false))
  }

  return (
    <SetSwipeableContainer
      exerciseOrder={exerciseOrder}
      setOrder={setOrder}
      isCompleted={exerciseSetStore.isCompleted}
      renderPreviousSetText={renderPreviousSetText}
      onPressPreviousSet={copyPreviousSet}
      onPressCompleteSet={toggleSetStatus}
    >
      <View style={$weightColumn}>
        <TextField
          status={isNullWeight ? "error" : null}
          value={weightInput ?? ""}
          onChangeText={handleWeightChangeText}
          inputWrapperStyle={styles.transparentBackground}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          inputMode="numeric"
          maxLength={7}
        />
      </View>
      <View style={$repsColumn}>
        <TextField
          status={isNullReps ? "error" : null}
          value={repsInput ?? ""}
          onChangeText={handleRepsChangeText}
          inputWrapperStyle={styles.transparentBackground}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="decimal-pad"
          maxLength={3}
        />
      </View>
      <View style={$rpeColumn}>
        <Dropdown
          containerStyle={$textFieldContainer}
          selectedValue={rpeInput}
          onValueChange={handleRpeChangeText}
          itemsList={rpeList}
          textAlign="center"
          size="md"
        />
      </View>
    </SetSwipeableContainer>
  )
})

export type SetEntryProps = {
  exerciseOrder: number
  exerciseId: string
  volumeType: ExerciseVolumeType
  setOrder: number
  setType: string
  weight: number
  reps: number
  isCompleted: boolean
}

export const SetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
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
}

const $weightColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $repsColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
}

const $rpeColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
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
}

const $textFieldContainer: ViewStyle = {
  padding: 0,
  width: 70,
}
