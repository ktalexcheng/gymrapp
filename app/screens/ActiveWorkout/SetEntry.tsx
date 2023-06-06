import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { spacing } from "../../theme"

export type SetEntryProps = {
  exerciseOrder: number
  exerciseId: string
  setOrder: number
  type: string
  weight: number
  reps: number
  ifCompleted: boolean
}

export const SetEntry: FC = observer((props: SetEntryProps) => {
  const { workoutStore, exerciseStore } = useStores()
  const { exerciseOrder, setOrder } = props
  const exerciseSetStore = workoutStore.exercises[exerciseOrder].sets[setOrder]

  function toggleSetStatus() {
    // setCompleted(!completed)
    exerciseSetStore.setProp("ifCompleted", !exerciseSetStore.ifCompleted)

    if (exerciseSetStore.ifCompleted) {
      workoutStore.setProp(
        "restTime",
        exerciseStore.allExercises.get(props.exerciseId).exerciseSettings.restTime,
      )
      workoutStore.setProp(
        "restTimeRemaining",
        exerciseStore.allExercises.get(props.exerciseId).exerciseSettings.restTime,
      )
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

  const $exerciseSet: ViewStyle = {
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing.tiny,
  }

  const $textFieldContainer: ViewStyle = {
    padding: 0,
    width: 70,
  }

  return (
    <RowView style={$exerciseSet}>
      <Text text={props.setOrder.toString()} style={[$setOrderColumn, $textAlignCenter]} />
      {/* TODO: Find last set record that is the same set order */}
      <Text text="N/A" style={[$previousColumn, $textAlignCenter]} />
      <View style={$weightColumn}>
        <TextField
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
          value={exerciseSetStore.reps !== undefined ? exerciseSetStore.reps.toString() : ""}
          onChangeText={setExerciseSetReps}
          containerStyle={$textFieldContainer}
          textAlign="center"
          autoCorrect={false}
          keyboardType="number-pad"
        />
      </View>
      <View style={[$ifCompletedColumn, $textAlignCenter]}>
        {exerciseSetStore.ifCompleted ? (
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

const $ifCompletedColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $textAlignCenter: TextStyle = {
  textAlign: "center",
}
