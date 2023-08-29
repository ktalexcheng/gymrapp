import { ExerciseSetType } from "app/data/constants"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon, RowView, Text } from "../../components"
import { useStores } from "../../stores"
import { spacing } from "../../theme"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry } from "./SetEntry"

export type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  // setsPerformed: ExerciseSet[]
}

export const ExerciseEntry: FC<ExerciseEntryProps> = observer((props: ExerciseEntryProps) => {
  const { workoutStore, exerciseStore } = useStores()
  const setsPerformed = workoutStore.exercises.get(
    props.exerciseOrder as unknown as string,
  ).setsPerformed
  const exerciseName = exerciseStore.allExercises.get(props.exerciseId).exerciseName
  const weightUnitTx = useWeightUnitTx(props.exerciseId)

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      setType: ExerciseSetType.Normal,
    })
  }

  return (
    <View>
      <View style={$exerciseSettingsButton}>
        <ExerciseSettingsMenu
          exerciseOrder={props.exerciseOrder}
          exerciseId={props.exerciseId}
          // exerciseSettings={
          //   exerciseStore.allExercises.get(props.exerciseId).exerciseSettings ??
          //   DefaultExerciseSettings
          // }
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
          <Text style={[$weightColumn, $textAlignCenter]}>
            {translate("activeWorkoutScreen.weightColumnHeader") + ` (${translate(weightUnitTx)})`}
          </Text>
          <Text tx="activeWorkoutScreen.repsColumnHeader" style={[$repsColumn, $textAlignCenter]} />
          <Text tx="activeWorkoutScreen.rpeColumnHeader" style={[$rpeColumn, $textAlignCenter]} />
          <Icon
            name="checkmark"
            style={[$isCompletedColumn, $textAlignCenter]}
            color="black"
            size={30}
          />
        </RowView>

        {setsPerformed.map((set, i) => (
          <SetEntry
            key={i}
            setOrder={i}
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
