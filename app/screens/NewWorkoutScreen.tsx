import { MainStackScreenProps } from "app/navigators"
import React, { FC, useState } from "react"
import { StyleProp, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { Button, Card, Modal, RowView, Screen, Spacer, Text } from "../components"
import { IActivityModel, useStores } from "../stores"
import { spacing } from "../theme"

type ResetWorkoutDialogProps = {
  visible: boolean
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

const ResetWorkoutDialog: FC<ResetWorkoutDialogProps> = function ResetWorkoutDialog(
  props: ResetWorkoutDialogProps,
) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.visible}
      onRequestClose={props.onCancel}
    >
      <Text tx="newActivityScreen.resumeWorkoutPromptMessage" />
      <Spacer type="vertical" size="medium" />
      <Button tx="newActivityScreen.resumeWorkout" preset="text" onPress={props.onResume} />
      <Button tx="newActivityScreen.startNewWorkoutText" preset="text" onPress={props.onReset} />
      <Button tx="common.cancel" preset="text" onPress={props.onCancel} />
    </Modal>
  )
}

interface NewWorkoutScreenProps extends MainStackScreenProps<"NewWorkout"> {}

export const NewWorkoutScreen: FC<NewWorkoutScreenProps> = function NewWorkoutScreen({
  navigation,
}) {
  const { activeWorkoutStore, activityStore, themeStore } = useStores()
  const [showResetWorkoutDialog, setShowResetWorkoutDialog] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string>()
  const [noActivitySelectedError, setNoActivitySelectedError] = useState(false)

  function toggleSelectedActivity(id: string) {
    if (id === selectedActivityId) {
      setSelectedActivityId(undefined)
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

    if (activeWorkoutStore.inProgress) {
      setShowResetWorkoutDialog(true)
    } else {
      activeWorkoutStore.startNewWorkout(selectedActivityId)
      navigation.navigate("ActiveWorkout")
    }
  }

  function resumeWorkout() {
    navigation.navigate("ActiveWorkout")
  }

  function resetWorkout() {
    activeWorkoutStore.resetWorkout()
    navigation.navigate("ActiveWorkout")
  }

  const $activitySelector: StyleProp<ViewStyle> = [
    $activitySelectorBase,
    {
      borderWidth: noActivitySelectedError ? 1 : undefined,
      borderColor: noActivitySelectedError ? themeStore.colors("error") : undefined,
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

      <RowView style={$startButtonContainer}>
        <Button
          tx="newActivityScreen.startNewWorkoutText"
          preset="text"
          onPress={startNewWorkout}
        />
      </RowView>

      <RowView scrollable={true} style={$activitySelector}>
        {Array.from(activityStore.allActivities.entries()).map(
          ([id, activity]: [string, IActivityModel]) => {
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

      <Text tx="newActivityScreen.nextWorkoutHeading" preset="subheading" style={$heading} />
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

      <Text tx="newActivityScreen.savedWorkoutHeading" preset="subheading" style={$heading} />
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
  flex: 1,
  padding: spacing.screenPadding,
}

const $startButtonContainer: ViewStyle = {
  justifyContent: "flex-end",
}

const $heading: TextStyle = {
  marginTop: spacing.large,
}

const $activitySelectorBase: ViewStyle = {
  marginTop: spacing.medium,
  gap: spacing.small,
}

const $activityCard: ViewStyle = {
  elevation: undefined,
}

const $programCard: ViewStyle = {
  borderRadius: 20,
  marginTop: spacing.medium,
}
