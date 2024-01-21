import { ExerciseSetType, ExerciseVolumeType } from "app/data/constants"
import { useWeightUnitTx } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"
import { Button, Icon, RowView, Text, TextField } from "../../components"
import { useStores } from "../../stores"
import { spacing, styles } from "../../theme"
import { ExerciseSettingsMenu } from "./ExerciseSettingsMenu"
import { SetEntry } from "./SetEntry"

export type ExerciseEntryProps = {
  exerciseOrder: number
  exerciseId: string
  // setsPerformed: ExerciseSet[]
}

export const ExerciseEntry: FC<ExerciseEntryProps> = observer((props: ExerciseEntryProps) => {
  const { workoutStore, exerciseStore, themeStore } = useStores()
  const mainNavigation = useMainNavigation()
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
            <View style={$weightColumn}>
              <Text textAlign="center">
                {translate("activeWorkoutScreen.weightColumnHeader") +
                  ` (${translate(weightUnitTx)})`}
              </Text>
            </View>
            <View style={$repsColumn}>
              <Text tx="activeWorkoutScreen.repsColumnHeader" textAlign="center" />
            </View>
            <View style={$rpeColumn}>
              <Text tx="activeWorkoutScreen.rpeColumnHeader" textAlign="center" />
            </View>
          </>
        )
      case ExerciseVolumeType.Time:
        return (
          <View style={$timeColumn}>
            <Text tx="activeWorkoutScreen.timeColumnHeader" textAlign="center" />
          </View>
        )
    }
  }

  function navigateToExerciseDetails() {
    mainNavigation.navigate("ExerciseDetails", {
      exerciseId: props.exerciseId,
    })
  }

  return (
    <View style={$exercise}>
      <RowView style={styles.justifyBetween}>
        <TouchableOpacity onPress={navigateToExerciseDetails}>
          <Text preset="bold">{"#" + (props.exerciseOrder + 1) + " " + exerciseName}</Text>
        </TouchableOpacity>
        <ExerciseSettingsMenu exerciseOrder={props.exerciseOrder} exerciseId={props.exerciseId} />
      </RowView>

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
        <View style={$setOrderColumn}>
          <Text tx="activeWorkoutScreen.setOrderColumnHeader" textAlign="center" />
        </View>
        <View style={$previousColumn}>
          <Text tx="activeWorkoutScreen.previousColumnHeader" textAlign="center" />
        </View>
        {renderVolumeTypeSpecificHeaders()}
        <View style={$isCompletedColumn}>
          <Icon name="checkmark" color={themeStore.colors("foreground")} size={30} />
        </View>
      </RowView>

      {renderSets()}

      <Button preset="text" tx="activeWorkoutScreen.addSetAction" onPress={addSet} />
    </View>
  )
})

const $exerciseNotesContainer: ViewStyle = {
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
  alignItems: "center",
}

const $previousColumn: ViewStyle = {
  flex: 2,
  alignItems: "center",
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

const $exercise: ViewStyle = {
  marginTop: spacing.medium,
}

const $exerciseSetsHeader: ViewStyle = {
  justifyContent: "space-around",
  marginVertical: spacing.medium,
  alignItems: "center",
}
