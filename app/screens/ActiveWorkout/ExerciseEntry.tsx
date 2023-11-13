import { ExerciseSetType, ExerciseVolumeType } from "app/data/constants"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Icon, RowView, Text, TextField } from "../../components"
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
  const thisExercise = workoutStore.exercises.at(props.exerciseOrder)
  const setsPerformed = thisExercise.setsPerformed
  const exerciseName = exerciseStore.getExerciseName(props.exerciseId)
  const volumeType = exerciseStore.getExerciseVolumeType(props.exerciseId)
  const weightUnitTx = useWeightUnitTx(props.exerciseId)

  function addSet() {
    workoutStore.addSet(props.exerciseOrder, {
      setType: ExerciseSetType.Normal,
    })
  }

  function renderSets() {
    return setsPerformed.map((set, i) => (
      <SetEntry
        key={i}
        setOrder={i}
        exerciseOrder={props.exerciseOrder}
        exerciseId={props.exerciseId}
        volumeType={volumeType}
        {...set}
      />
    ))
  }

  function renderVolumeTypeSpecificHeaders() {
    switch (thisExercise.volumeType) {
      case ExerciseVolumeType.Reps:
        return (
          <>
            <Text style={[$weightColumn, $textAlignCenter]}>
              {translate("activeWorkoutScreen.weightColumnHeader") +
                ` (${translate(weightUnitTx)})`}
            </Text>
            <Text
              tx="activeWorkoutScreen.repsColumnHeader"
              style={[$repsColumn, $textAlignCenter]}
            />
            <Text tx="activeWorkoutScreen.rpeColumnHeader" style={[$rpeColumn, $textAlignCenter]} />
          </>
        )
      case ExerciseVolumeType.Time:
        return (
          <>
            <Text
              tx="activeWorkoutScreen.timeColumnHeader"
              style={[$timeColumn, $textAlignCenter]}
            />
          </>
        )
    }
  }

  return (
    <View>
      <View style={$exerciseSettingsButton}>
        <ExerciseSettingsMenu exerciseOrder={props.exerciseOrder} exerciseId={props.exerciseId} />
      </View>

      <View style={$exercise}>
        <Text preset="bold">{"#" + props.exerciseOrder + " " + exerciseName}</Text>
        <TextField
          containerStyle={$exerciseNotesContainer}
          inputWrapperStyle={$exerciseNotesInputWrapper}
          style={$exerciseNotesInputStyle}
          multiline={true}
          value={thisExercise.exerciseNotes}
          onChangeText={(text) => thisExercise.setProp("exerciseNotes", text)}
          placeholderTx="activeWorkoutScreen.addNotesPlaceholder"
        />

        <RowView style={$exerciseSetsHeader}>
          <Text
            tx="activeWorkoutScreen.setOrderColumnHeader"
            style={[$setOrderColumn, $textAlignCenter]}
          />
          <Text
            tx="activeWorkoutScreen.previousColumnHeader"
            style={[$previousColumn, $textAlignCenter]}
          />
          {renderVolumeTypeSpecificHeaders()}
          <Icon
            name="checkmark"
            style={[$isCompletedColumn, $textAlignCenter]}
            color="black"
            size={30}
          />
        </RowView>

        {renderSets()}

        <TouchableOpacity onPress={addSet}>
          <RowView style={$exerciseActions}>
            <Text tx="activeWorkoutScreen.addSetAction" />
          </RowView>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const $exerciseNotesContainer: ViewStyle = {
  marginTop: spacing.medium,
  width: "90%",
}

const $exerciseNotesInputWrapper: ViewStyle = {
  borderWidth: 0,
  minHeight: 12,
}

const $exerciseNotesInputStyle: ViewStyle = {
  marginHorizontal: spacing.tiny,
}

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

const $timeColumn: ViewStyle = {
  flex: 3,
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
