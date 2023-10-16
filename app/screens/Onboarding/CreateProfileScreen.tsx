import { Screen, Text } from "app/components"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { ScrollView, ViewStyle } from "react-native"
import { EditProfileForm } from "../UserProfile"

export const CreateProfileScreen = observer(() => {
  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text tx="editProfileForm.editProfileTitle" preset="heading" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <EditProfileForm />
      </ScrollView>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}
