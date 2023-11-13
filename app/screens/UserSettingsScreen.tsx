import { Button, Screen } from "app/components"
import { translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { Alert, ViewStyle } from "react-native"
import { EditProfileForm } from "./UserProfile"

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore } = useStores()

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
    <Screen preset="scroll" safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <EditProfileForm />
      <Button preset="text" onPress={authStore.logout} tx="userSettingsScreen.logout" />
      <Button preset="text" onPress={showDeleteAlert} tx="userSettingsScreen.deleteAccount" />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
}
