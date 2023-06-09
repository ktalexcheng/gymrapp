import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { spacing } from "../../theme"
import { DefaultExerciseSettings } from "./defaultExerciseSettings"

export type SetEntryProps = {
  exerciseOrder: number
  exerciseId: string
  setOrder: number
  type: string
  weight: number
  reps: number
  isCompleted: boolean
}

export const SetEntry: FC = observer((props: SetEntryProps) => {
  const { workoutStore, exerciseStore } = useStores()
  const { exerciseOrder, setOrder } = props
  const [isNullWeight, setIsNullWeight] = useState(false)
  const [isNullReps, setIsNullReps] = useState(false)
  const exerciseSetStore = workoutStore.exercises[exerciseOrder].setsPerformed[setOrder]

  function toggleSetStatus() {
    if (exerciseSetStore.isCompleted) {
      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
      return
    }

    if (exerciseSetStore.validWeight && exerciseSetStore.validReps) {
      setIsNullWeight(false)
      setIsNullReps(false)

      workoutStore.setProp(
        "restTime",
        exerciseStore.allExercises.get(props.exerciseId).exerciseSettings?.restTime ??
          DefaultExerciseSettings.restTime,
      )
      workoutStore.setProp(
        "restTimeRemaining",
        exerciseStore.allExercises.get(props.exerciseId).exerciseSettings?.restTime ??
          DefaultExerciseSettings.restTime,
      )

      exerciseSetStore.setProp("isCompleted", !exerciseSetStore.isCompleted)
    } else {
      setIsNullWeight(!exerciseSetStore.validWeight)
      setIsNullReps(!exerciseSetStore.validReps)
    }
  }

  function setExerciseSetWeight(value: string) {
    if (value) {
      exerciseSetStore.setProp("weight", Number(value))
    } else {
      exerciseSetStore.setProp("weight", undefined)
    }
  }

  function setExerciseSetReps(value: string) {
    if (value) {
      exerciseSetStore.setProp("reps", Number(value))
    } else {
      exerciseSetStore.setProp("reps", undefined)
    }
  }

  return (
    <RowView style={$exerciseSet}>
      <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
      {/* TODO: Find last set record that is the same set order */}
      <Text text="N/A" style={[$previousColumn, $textAlignCenter]} />
      <View style={$weightColumn}>
        <TextField
          status={isNullWeight ? "error" : null}
          value={exerciseSetStore.weight !== undefined ? exerciseSetStore.weight.toString() : ""}
          onChangeText={setExerciseSetWeight}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="number-pad"
        />
      </View>
      <View style={$repsColumn}>
        <TextField
          status={isNullReps ? "error" : null}
          value={exerciseSetStore.reps !== undefined ? exerciseSetStore.reps.toString() : ""}
          onChangeText={setExerciseSetReps}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="number-pad"
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
