import { Screen, Text } from "app/components"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { ViewStyle } from "react-native"
import { EditProfileForm } from "../UserProfile"

export const CreateProfileScreen = observer(() => {
  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      <Text tx="editProfileForm.editProfileTitle" preset="heading" />
      <EditProfileForm />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  marginVertical: spacing.large,
  paddingHorizontal: spacing.large,
}
