import { ExerciseSetType } from "app/data/model"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon, RowView, Text } from "../../components"
import { useStores } from "../../stores"
import { spacing } from "../../theme"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry, SetEntryProps } from "./SetEntry"
import { DefaultExerciseSettings } from "./defaultExerciseSettings"

export type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  exerciseName: string
  setsPerformed: SetEntryProps[]
}

export const ExerciseEntry: FC = observer((props: ExerciseEntryProps) => {
  const { workoutStore, exerciseStore } = useStores()

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      setType: ExerciseSetType.Normal,
    })
  }

  const exerciseName = exerciseStore.allExercises.get(props.exerciseId).exerciseName

  return (
    <View>
      <View style={$exerciseSettingsButton}>
        <ExerciseSettingsMenu
          exerciseId={props.exerciseId}
          exerciseSettings={
            exerciseStore.allExercises.get(props.exerciseId).exerciseSettings ??
            DefaultExerciseSettings
          }
        />
      </View>

      <View style={$exercise}>
        <Text preset="bold">{"#" + props.exerciseOrder + " " + exerciseName}</Text>
        <Text tx="activeWorkoutScreen.addNotesPlaceholder" />

        <RowView style={$exerciseSetsHeader}>
          <Text
            tx="activeWorkoutScreen.setOrderColumnHeader"
            style={[$setOrderColumn, $textAlignCenter]}
          />
          <Text
            tx="activeWorkoutScreen.previousColumnHeader"
            style={[$previousColumn, $textAlignCenter]}
          />
          <Text
            tx="activeWorkoutScreen.weightColumnHeader"
            style={[$weightColumn, $textAlignCenter]}
          />
          <Text tx="activeWorkoutScreen.repsColumnHeader" style={[$repsColumn, $textAlignCenter]} />
          <Text tx="activeWorkoutScreen.rpeColumnHeader" style={[$rpeColumn, $textAlignCenter]} />
          <Icon
            name="checkmark"
            style={[$isCompletedColumn, $textAlignCenter]}
            color="black"
            size={30}
          />
        </RowView>

        {props.setsPerformed.map((set) => (
          <SetEntry
            key={set.setOrder}
            exerciseOrder={props.exerciseOrder}
            exerciseId={props.exerciseId}
            {...set}
          />
        ))}

        <TouchableOpacity onPress={addSet}>
          <RowView style={$exerciseActions}>
            <Text tx="activeWorkoutScreen.addSetAction" />
          </RowView>
        </TouchableOpacity>
      </View>
    </View>
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

const $exercise: ViewStyle = {
  marginTop: spacing.medium,
}

const $exerciseSetsHeader: ViewStyle = {
  justifyContent: "space-around",
  marginVertical: spacing.medium,
  alignItems: "center",
}

const $exerciseActions: ViewStyle = {
  justifyContent: "space-around",
  marginTop: spacing.medium,
}

const $exerciseSettingsButton: ViewStyle = {
  position: "absolute",
  top: spacing.large,
  right: spacing.small,
  zIndex: 1, // Note: Critical to surface overlaying touchable components
}
