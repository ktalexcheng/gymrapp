import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { Button, Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { colors, spacing, thresholds } from "../../theme"
import { DefaultExerciseSettings } from "./defaultExerciseSettings"

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
  const { workoutStore, exerciseStore } = useStores()
  const { exerciseOrder, setOrder } = props
  const [isNullWeight, setIsNullWeight] = useState(false)
  const [isNullReps, setIsNullReps] = useState(false)
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [rpe, setRpe] = useState("")
  const exerciseSetStore = workoutStore.exercises[exerciseOrder].setsPerformed[setOrder]

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
      return
    }

    if (weight && reps) {
      setIsNullWeight(false)
      setIsNullReps(false)

      exerciseSetStore.updateSetValues("weight", weight)
      exerciseSetStore.updateSetValues("reps", reps)
      exerciseSetStore.updateSetValues("rpe", rpe)

      workoutStore.restartRestTimer(
        exerciseStore.allExercises.get(props.exerciseId).exerciseSettings?.restTime ??
          DefaultExerciseSettings.restTime,
      )

      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
    } else {
      setIsNullWeight(!weight)
      setIsNullReps(!reps)
    }
  }

  function isLegalPrecision(value: string, decimalPlaces: number) {
    const decimalIndex = value.indexOf(".")
    if (decimalPlaces === 0 && decimalIndex !== -1) {
      return false
    }

    if (decimalIndex !== -1 && value.substring(decimalIndex + 1).length > decimalPlaces) {
      return false
    }

    return true
  }

  function handleWeightChangeText(value: string) {
    if (isLegalPrecision(value, 2)) setWeight(value)
  }

  function handleRepsChangeText(value: string) {
    if (isLegalPrecision(value, 0)) setReps(value)
  }

  function handleRpeChangeText(value: string) {
    if (isLegalPrecision(value, 1)) setRpe(value)
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
            value={weight}
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
            value={reps}
            onChangeText={handleRepsChangeText}
            containerStyle={$textFieldContainer}
            textAlign="center"
            autoCorrect={false}
            keyboardType="decimal-pad"
            maxLength={4}
          />
        </View>
        <View style={$rpeColumn}>
          <TextField
            value={rpe}
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
