import Ionicons from "@expo/vector-icons/Ionicons"
import { observer } from "mobx-react-lite"
import { Box } from "native-base"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { RowView, Text } from "../../components"
import { useStores } from "../../stores"
import { spacing } from "../../theme"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry, SetEntryProps } from "./SetEntry"

export type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  exerciseName: string
  sets: SetEntryProps[]
}

export const ExerciseEntry: FC = observer((props: ExerciseEntryProps) => {
  const { workoutStore, exerciseStore } = useStores()

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      type: "Normal",
    })
  }

  const $exercise: ViewStyle = {
    marginTop: spacing.medium,
  }

  const $exerciseSetsHeader: ViewStyle = {
    justifyContent: "space-around",
    marginTop: spacing.medium,
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

  console.debug("ExerciseEntry props", props)

  return (
    <View>
      <Box style={$exerciseSettingsButton}>
        <ExerciseSettingsMenu
          exerciseId={props.exerciseId}
          exerciseSettings={exerciseStore.allExercises.get(props.exerciseId).exerciseSettings}
        />
      </Box>

      <View style={$exercise}>
        <Text preset="bold">{"#" + props.exerciseOrder + " " + props.exerciseName}</Text>
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
          <Ionicons
            name="checkmark"
            style={[$ifCompletedColumn, $textAlignCenter]}
            color="black"
            size={30}
          />
        </RowView>
        {/* TODO: Create reuseable component for exercise sets */}
        {props.sets.map((set) => (
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

const $ifCompletedColumn: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $textAlignCenter: TextStyle = {
  textAlign: "center",
}
