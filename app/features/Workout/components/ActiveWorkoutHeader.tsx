import { Button, Icon, RowView, TextField } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import React, { useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { DiscardEmptyWorkoutModal } from "./DiscardEmptyWorkoutModal"
import { RemoveIncompleteSetsModal } from "./RemoveIncompleteSetsModal"
import { RestTimerProgressBar } from "./RestTimerProgressBar"

type ActiveWorkoutHeaderProps = {
  workoutTitle: string
  onChangeWorkoutTitle: (workoutTitle: string) => void
  isRestTimerRunning: boolean
  restTimeRemaining?: number
  totalRestTime: number
  onFinishWorkout: () => void
}

export const ActiveWorkoutHeader = (props: ActiveWorkoutHeaderProps) => {
  const {
    workoutTitle,
    onChangeWorkoutTitle,
    isRestTimerRunning,
    restTimeRemaining,
    totalRestTime,
    onFinishWorkout,
  } = props

  const mainNavigation = useMainNavigation()
  const { themeStore, activeWorkoutStore: workoutStore } = useStores()

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
    onFinishWorkout()
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
    onFinishWorkout()
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
          <RowView
            style={[styles.flex1, styles.alignCenter, isRestTimerRunning ? styles.flex2 : null]}
          >
            <Icon
              name="chevron-down-outline"
              color={themeStore.colors("foreground")}
              size={30}
              onPress={() => mainNavigation.navigate("HomeTabNavigator")}
            />
            <RestTimerProgressBar
              isRestTimerRunning={isRestTimerRunning}
              restTimeRemaining={restTimeRemaining ?? 0}
              totalRestTime={totalRestTime}
            />
          </RowView>

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
