import { Activity } from "app/data/model/activityModel"
import { MainStackScreenProps } from "app/navigators"
import React, { FC, useState } from "react"
import { Modal, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Card, RowView, Screen, Text } from "../components"
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
          <Text tx="newActivityScreen.resumeWorkoutPromptMessage" />
          <TouchableOpacity onPress={props.onResume}>
            <Text tx="newActivityScreen.resumeWorkout" />
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onReset}>
            <Text tx="newActivityScreen.startNewWorkoutText" />
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onCancel}>
            <Text tx="common.cancel" />
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
  const { workoutStore, activityStore } = useStores()
  const [showResetWorkoutDialog, setShowResetWorkoutDialog] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [noActivitySelectedError, setNoActivitySelectedError] = useState(false)

  function toggleSelectedActivity(id: string) {
    if (id === selectedActivityId) {
      setSelectedActivityId(null)
    } else {
      setSelectedActivityId(id)
    }

    setNoActivitySelectedError(false)
  }

  function startNewWorkout() {
    if (!selectedActivityId) {
      setNoActivitySelectedError(true)
      return
    }

    if (workoutStore.inProgress) {
      setShowResetWorkoutDialog(true)
    } else {
      workoutStore.startNewWorkout(selectedActivityId)
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

  const $activitySelector: ViewStyle[] = [
    $activitySelectorBase,
    {
      borderWidth: noActivitySelectedError ? 1 : null,
      borderColor: noActivitySelectedError ? colors.error : null,
    },
  ]

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
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

      <RowView scrollable={true} style={$activitySelector}>
        {Array.from(activityStore.allActivities.entries()).map(
          ([id, activity]: [string, Activity]) => {
            return (
              <Card
                key={id}
                preset={!selectedActivityId || selectedActivityId === id ? "default" : "dimmed"}
                style={$activityCard}
                heading={activity.activityName}
                onPress={() => {
                  toggleSelectedActivity(id)
                }}
              />
            )
          },
        )}
      </RowView>

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
          style={$programCard}
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
          style={$programCard}
        />
      </TouchableOpacity>
    </Screen>
  )
}

const $container: ViewStyle = {
  padding: spacing.screenPadding,
}

const $pressableText: TextStyle = {
  textAlign: "right",
  color: colors.actionable,
}

const $heading: TextStyle = {
  marginTop: spacing.large,
}

const $activitySelectorBase: ViewStyle = {
  marginTop: spacing.medium,
  gap: spacing.small,
}

const $activityCard: ViewStyle = {
  elevation: null,
}

const $programCard: ViewStyle = {
  borderRadius: 20,
  marginTop: spacing.medium,
}
