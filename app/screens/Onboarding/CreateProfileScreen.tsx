import { Screen } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { ViewStyle } from "react-native"
import { EditProfileForm } from "../UserProfile"

export const CreateProfileScreen = observer(() => {
  const mainNavigation = useMainNavigation()

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      <EditProfileForm
        key="EditProfileForm"
        saveProfileCompletedCallback={() => {
          mainNavigation.navigate("HomeTabNavigator")
        }}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  padding: spacing.screenPadding,
}
