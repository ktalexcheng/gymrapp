import { Screen, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { styles } from "app/theme"
import React from "react"
import { GymPicker } from "../Gym"

export const AddToMyGymsScreen = () => {
  const mainNavigation = useMainNavigation()
  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <Text tx="addToMyGymsScreen.addToMyGymsTitle" preset="heading" />
      <GymPicker
        onGymSelected={(gym) => mainNavigation.navigate("GymDetails", { gymId: gym.gymId })}
      />
    </Screen>
  )
}
