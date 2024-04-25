import { Button, Divider, Screen } from "app/components"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert, ViewStyle } from "react-native"
import { EditProfileForm } from "./EditProfileForm"

export const UserSettingsScreen = observer(function () {
  const { themeStore, authenticationStore: authStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [isBusy, setIsBusy] = useState(false)

  const showDeleteAlert = () => {
    Alert.alert(
      translate("userSettingsScreen.deleteAccountAlertTitle"),
      translate("userSettingsScreen.deleteAccountAlertMessage"),
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

  const showLogoutAlert = () => {
    Alert.alert(
      translate("userSettingsScreen.logoutAlertTitle"),
      translate("userSettingsScreen.logoutAlertMessage"),
      [
        { text: translate("common.cancel"), style: "cancel" },
        {
          text: translate("userSettingsScreen.logoutAlertTitle"),
          style: "destructive",
          onPress: () => authStore.logout(),
        },
      ],
    )
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={styles.screenContainer}
      isBusy={isBusy}
    >
      <EditProfileForm
        saveProfileCompletedCallback={() => {
          // EditProfileForm has a listener for the navigation 'beforeRemove' event
          // it could be called multiple times, so we need to check if we can go back
          if (mainNavigation.canGoBack()) mainNavigation.goBack()
        }}
        onBusyChange={setIsBusy}
      />
      <Divider
        tx="userSettingsScreen.accountControlsSectionLabel"
        orientation="horizontal"
        spaceSize={30}
      />
      <Button
        preset="text"
        style={$accountControlButton}
        tx="userSettingsScreen.logoutAlertTitle"
        onPress={showLogoutAlert}
      />
      <Button
        preset="text"
        style={$accountControlButton}
        textStyle={{ color: themeStore.colors("danger") }}
        tx="userSettingsScreen.deleteAccountAlertTitle"
        onPress={showDeleteAlert}
      />
    </Screen>
  )
})

const $accountControlButton: ViewStyle = {
  // marginVertical: spacing.small,
}
