import { Button, RowView, TextField } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import React, { useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { DiscardEmptyWorkoutModal } from "./DiscardEmptyWorkoutModal"
import { RemoveIncompleteSetsModal } from "./RemoveIncompleteSetsModal"

type EditWorkoutHeaderProps = {
  workoutTitle: string
  onChangeWorkoutTitle: (workoutTitle: string) => void
  onUpdate: () => void
  onDiscard: () => void
}

export const EditWorkoutHeader = (props: EditWorkoutHeaderProps) => {
  const { workoutTitle, onChangeWorkoutTitle, onUpdate, onDiscard } = props

  const mainNavigation = useMainNavigation()
  const { workoutEditorStore: workoutStore } = useStores()

  const [showEmptyWorkoutModal, setShowEmptyWorkoutModal] = useState(false)
  const [showRemoveIncompleteSetsModal, setShowRemoveIncompleteSetsModal] = useState(false)

  function validateWorkout() {
    if (workoutStore.isEmptyWorkout) {
      setShowEmptyWorkoutModal(true)
      return false
    }

    if (!workoutStore.isAllSetsCompleted) {
      setShowRemoveIncompleteSetsModal(true)
      return false
    }

    return true
  }

  function hideAllModals() {
    setShowEmptyWorkoutModal(false)
    setShowRemoveIncompleteSetsModal(false)
  }

  function onConfirmRemoveIncompleteSets() {
    hideAllModals()
    onUpdate()
  }

  function discardWorkout() {
    hideAllModals()
    workoutStore.endWorkout()
    mainNavigation.navigate("HomeTabNavigator")
  }

  const cancelFinishWorkout = () => {
    hideAllModals()
    workoutStore.resumeWorkout()
  }

  const handleFinishWorkout = () => {
    if (!validateWorkout()) return
    onUpdate()
  }

  return (
    <>
      <DiscardEmptyWorkoutModal
        visible={showEmptyWorkoutModal}
        onDiscard={discardWorkout}
        onCancel={cancelFinishWorkout}
      />

      <RemoveIncompleteSetsModal
        visible={showRemoveIncompleteSetsModal}
        onConfirm={onConfirmRemoveIncompleteSets}
        onCancel={cancelFinishWorkout}
      />

      <View>
        <RowView style={$workoutHeaderRow}>
          <Button preset="text" tx="common.discard" onPress={onDiscard} />

          <TextField
            selectTextOnFocus
            containerStyle={styles.flex4}
            inputWrapperStyle={$workoutTitleWrapper}
            style={$workoutTitle}
            value={workoutTitle}
            placeholderTx="activeWorkoutScreen.newActiveWorkoutTitle"
            onChangeText={onChangeWorkoutTitle}
            autoCapitalize="sentences"
          />

          <Button
            tx={"activeWorkoutScreen.finishWorkoutButton"}
            preset="text"
            onPress={handleFinishWorkout}
          />
        </RowView>
      </View>
    </>
  )
}

const $workoutHeaderRow: ViewStyle = {
  justifyContent: "space-between",
  alignItems: "center",
}

const $workoutTitleWrapper: TextStyle = {
  borderWidth: 0,
}

const $workoutTitle: TextStyle = {
  fontWeight: "bold",
  textAlign: "center",
}
