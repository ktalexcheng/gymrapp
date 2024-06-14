import { Screen, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { styles } from "app/theme"
import React from "react"
import { CreateExercise } from "../components/CreateExercise"

export const CreateExerciseScreen = () => {
  const mainNavigation = useMainNavigation()

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={styles.screenContainer} preset="auto">
      <Text tx="createExerciseScreen.createExerciseTitle" preset="heading" />
      <CreateExercise onCreateSuccess={() => mainNavigation.goBack()} />
    </Screen>
  )
}
