import { DefaultExerciseSettings } from "app/data/model"
import { useWeight } from "app/hooks"
import { roundToString } from "app/utils/formatNumber"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { Button, Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing, thresholds } from "../../theme"

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
  const { workoutStore, exerciseStore, userStore } = useStores()
  const { exerciseId, exerciseOrder, setOrder } = props
  // Current exercise set
  const exerciseSetStore = workoutStore.exercises.get(exerciseOrder as unknown as string)
    .setsPerformed[setOrder]

  // Exercise settings
  const exerciseSettings = exerciseStore.allExercises.get(exerciseId).exerciseSettings
  const restTime = exerciseSettings?.restTime ?? DefaultExerciseSettings.restTime
  const initDisplayWeightUnit =
    exerciseSettings?.weightUnit ??
    userStore.user?.preferences?.weightUnit ??
    DefaultExerciseSettings.weightUnit

  // States
  const [isNullWeight, setIsNullWeight] = useState(false)
  const [isNullReps, setIsNullReps] = useState(false)
  // Weight is always converted and stored in kg,
  // but depending on user preference will display as kg or lbs (using displayWeight)
  // const [weight, setWeight] = useState<number>(null)
  const [displayWeight, weightKg, setDisplayWeight, setDisplayUnit] = useWeight(
    exerciseSetStore.weight,
    initDisplayWeightUnit,
  )
  const [reps, setReps] = useState<number>(exerciseSetStore.reps)
  const [rpe, setRpe] = useState<number>(exerciseSetStore.rpe)
  const [weightInput, setWeightInput] = useState<string>(roundToString(displayWeight, 2, false))
  const [repsInput, setRepsInput] = useState<string>(reps?.toString())
  const [rpeInput, setRpeInput] = useState<string>(rpe?.toString())

  useEffect(() => {
    if (exerciseSettings?.weightUnit) {
      setDisplayUnit(exerciseSettings.weightUnit)
    } else if (userStore.user?.preferences?.weightUnit) {
      setDisplayUnit(userStore.user.preferences.weightUnit)
    }
  }, [exerciseSettings?.weightUnit, userStore.user?.preferences?.weightUnit])

  useEffect(() => {
    setWeightInput(roundToString(displayWeight, 2, false))
    updateSetStore()
  }, [displayWeight, reps, rpe])

  function updateSetStore() {
    exerciseSetStore.updateSetValues("weight", weightKg)
    exerciseSetStore.updateSetValues("reps", reps)
    exerciseSetStore.updateSetValues("rpe", rpe)
  }

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
      return
    }

    if (displayWeight && reps) {
      setIsNullWeight(false)
      setIsNullReps(false)

      exerciseSetStore.updateSetValues("weight", weightKg)
      exerciseSetStore.updateSetValues("reps", reps)
      exerciseSetStore.updateSetValues("rpe", rpe)

      workoutStore.restartRestTimer(restTime)

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
      setRpeInput(null)
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

  return (
    <Swipeable renderRightActions={renderRightDelete} rightThreshold={thresholds.swipeableRight}>
      <RowView style={$exerciseSet}>
        <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
        {/* TODO: Find last set record that is the same set order */}
        <Text text="N/A" style={[$previousColumn, $textAlignCenter]} />
        <View style={$weightColumn}>
          <TextField
            status={isNullWeight ? "error" : null}
            value={weightInput ?? ""}
            onChangeText={handleWeightChangeText}
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
            containerStyle={$textFieldContainer}
            textAlign="center"
            autoCorrect={false}
            keyboardType="decimal-pad"
            maxLength={3}
          />
        </View>
        <View style={$rpeColumn}>
          <TextField
            value={rpeInput ?? ""}
            onChangeText={handleRpeChangeText}
            containerStyle={$textFieldContainer}
            textAlign="center"
            autoCorrect={false}
            keyboardType="decimal-pad"
            maxLength={3}
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
  backgroundColor: colors.background,
}

const $textFieldContainer: ViewStyle = {
  padding: 0,
  width: 70,
}
