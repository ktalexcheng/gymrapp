import { MainStackScreenProps } from "app/navigators"
import React, { FC, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Card, Screen, Text } from "../components"
import { useStores } from "../stores"
import { colors, spacing } from "../theme"

type ResetWorkoutDialogProps = {
  visible: boolean
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

const ResetWorkoutDialog: FC<ResetWorkoutDialogProps> = function ResetWorkoutDialog(
  props: ResetWorkoutDialogProps,
) {
  const $saveDialogContainer: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }

  const $saveDialog: ViewStyle = {
    flexBasis: "auto",
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.visible}
      onRequestClose={props.onCancel}
    >
      <View style={$saveDialogContainer}>
        <View style={$saveDialog}>
          <Text>Resume or start new workout?</Text>
          <TouchableOpacity onPress={props.onResume}>
            <Text>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onReset}>
            <Text>Start New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onCancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

interface NewWorkoutScreenProps extends MainStackScreenProps<"NewWorkout"> {}

export const NewWorkoutScreen: FC<NewWorkoutScreenProps> = function NewWorkoutScreen({
  navigation,
}) {
  const { workoutStore } = useStores()
  const [showResetWorkoutDialog, setShowResetWorkoutDialog] = useState(false)

  function startNewWorkout() {
    if (workoutStore.inProgress) {
      setShowResetWorkoutDialog(true)
    } else {
      workoutStore.startNewWorkout()
      navigation.navigate("ActiveWorkout")
    }
  }

  function resumeWorkout() {
    navigation.navigate("ActiveWorkout")
  }

  function resetWorkout() {
    workoutStore.resetWorkout()
    navigation.navigate("ActiveWorkout")
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
      <ResetWorkoutDialog
        visible={showResetWorkoutDialog}
        onResume={resumeWorkout}
        onReset={resetWorkout}
        onCancel={() => setShowResetWorkoutDialog(false)}
      />

      <Text
        tx="newActivityScreen.startNewWorkoutText"
        style={$pressableText}
        onPress={startNewWorkout}
      />

      <Text tx="newActivityScreen.nextWorkoutHeading" preset="heading" style={$heading} />
      <TouchableOpacity
        onPress={() => {
          console.debug("TODO: Start next workout in program")
        }}
      >
        <Card
          preset="default"
          heading="Next workout name"
          content="Next workout preview"
          style={$card}
        />
      </TouchableOpacity>

      <Text tx="newActivityScreen.savedWorkoutHeading" preset="heading" style={$heading} />
      <TouchableOpacity
        onPress={() => {
          console.debug("TODO: Start workout from template")
        }}
      >
        <Card
          preset="default"
          heading="Recently saved workout name"
          content="Recently saved workout preview"
          style={$card}
        />
      </TouchableOpacity>
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.screen,
}

const $pressableText: TextStyle = {
  textAlign: "right",
  color: colors.actionBackground,
}

const $heading: TextStyle = {
  marginTop: 20,
}

const $card: ViewStyle = {
  borderRadius: 20,
  marginTop: 20,
}
