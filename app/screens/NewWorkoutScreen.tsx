import { ActivityStackScreenProps } from "app/navigators/ActivityNavigator"
import React, { FC } from "react"
import { TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { Card, Screen, Text } from "../components"
import { useStores } from "../stores"
import { colors, spacing } from "../theme"

interface NewWorkoutScreenProps extends ActivityStackScreenProps<"NewWorkout"> {}

export const NewWorkoutScreen: FC<NewWorkoutScreenProps> = function NewWorkoutScreen({
  navigation,
}) {
  const { workoutStore } = useStores()

  function startNewWorkout() {
    workoutStore.initNewWorkout()
    navigation.navigate("ActiveWorkout")
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$container}>
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
