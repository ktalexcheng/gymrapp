import { Button, Screen } from "app/components"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { Alert, ViewStyle } from "react-native"
import { EditProfileForm } from "./UserProfile"

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore } = useStores()
  const mainNavigation = useMainNavigation()

  const showDeleteAlert = () => {
    Alert.alert(
      translate("userSettingsScreen.deleteAccount"),
      translate("userSettingsScreen.deleteAccountConfirmationMessage"),
      [
        { text: translate("common.cancel"), style: "cancel" },
        {
          text: translate("common.delete"),
          style: "destructive",
          onPress: () => authStore.deleteAccount(),
        },
      ],
    )
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      <EditProfileForm
        saveProfileCompletedCallback={() => {
          // EditProfileForm has a listener for the navigation 'beforeRemove' event
          // it could be called multiple times, so we need to check if we can go back
          if (mainNavigation.canGoBack()) mainNavigation.goBack()
        }}
      />
      <Button preset="text" onPress={authStore.logout} tx="userSettingsScreen.logout" />
      <Button preset="text" onPress={showDeleteAlert} tx="userSettingsScreen.deleteAccount" />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
}
