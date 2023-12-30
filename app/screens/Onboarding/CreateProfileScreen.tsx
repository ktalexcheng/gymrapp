import { Screen } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { ViewStyle } from "react-native"
import { EditProfileForm } from "../UserProfile"

export const CreateProfileScreen = observer(() => {
  const mainNavigation = useMainNavigation()
  const [isBusy, setIsBusy] = useState(false)

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
      isBusy={isBusy}
    >
      <EditProfileForm
        key="EditProfileForm"
        saveProfileCompletedCallback={() => {
          mainNavigation.navigate("HomeTabNavigator")
        }}
        onBusyChange={setIsBusy}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  padding: spacing.screenPadding,
}
