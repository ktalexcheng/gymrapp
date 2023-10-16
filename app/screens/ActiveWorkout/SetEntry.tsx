import { WeightUnit } from "app/data/constants"
import { ExerciseSet } from "app/data/model"
import { useWeight } from "app/hooks"
import { useExerciseSetting } from "app/hooks/useExerciseSetting"
import { translate } from "app/i18n"
import { roundToString } from "app/utils/formatNumber"
import { Weight } from "app/utils/weight"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { Button, Dropdown, Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing, styles, thresholds } from "../../theme"

export type SetEntryProps = {
  exerciseOrder: number
  exerciseId: string
  setOrder: number
  setType: string
  weight: number
  reps: number
  isCompleted: boolean
}

export const SetEntry: FC<SetEntryProps> = observer((props: SetEntryProps) => {
  const { workoutStore, userStore } = useStores()
  const { exerciseId, exerciseOrder, setOrder } = props
  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.at(exerciseOrder).setsPerformed[setOrder]

  // Set from previous workout
  const setFromLastWorkout = userStore.getSetFromLastWorkout(exerciseId, setOrder) as ExerciseSet

  // Exercise settings
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
  const rpeList = Array.from({ length: 9 }, (_, i) => {
    const rpe = 6 + 0.5 * i
    return {
      label: rpe.toString(),
      value: rpe.toString(),
    }
  })
  // Using empty string as the first item in the list to allow for clearing the dropdown
  rpeList.unshift({ label: translate("activeWorkoutScreen.rpeNullLabel"), value: null })

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
      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
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

  const $exerciseSetCompletion: ViewStyle = {
    backgroundColor: exerciseSetStore.isCompleted ? colors.success : colors.background,
  }

  return (
    <Swipeable renderRightActions={renderRightDelete} rightThreshold={thresholds.swipeableRight}>
      <RowView style={[$exerciseSet, $exerciseSetCompletion]}>
        <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
        <TouchableOpacity
          disabled={!setFromLastWorkout}
          onPress={copyPreviousSet}
          style={$previousColumn}
        >
          <Text text={renderPreviousSetText()} style={$textAlignCenter} />
        </TouchableOpacity>
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
            dropdownIcon={<></>}
            selectedValue={rpeInput}
            onValueChange={handleRpeChangeText}
            itemsList={rpeList}
            textAlign="center"
            size="md"
          />
        </View>
        <View style={[$isCompletedColumn, $textAlignCenter]}>
          {exerciseSetStore.isCompleted ? (
            <Icon name="checkbox" color="black" size={30} onPress={toggleSetStatus} />
          ) : (
            <Icon name="checkbox-outline" color="black" size={30} onPress={toggleSetStatus} />
          )}
        </View>
      </RowView>
    </Swipeable>
  )
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
