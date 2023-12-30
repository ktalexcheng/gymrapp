import { Button, Divider, Screen } from "app/components"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { Alert, ViewStyle } from "react-native"
import { EditProfileForm } from "./UserProfile"

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [isBusy, setIsBusy] = useState(false)

  // TODO: Delete account procedure needs to be thought through more
  // const showDeleteAlert = () => {
  //   Alert.alert(
  //     translate("userSettingsScreen.deleteAccountAlertTitle"),
  //     translate("userSettingsScreen.deleteAccountAlertMessage"),
  //     [
  //       { text: translate("common.cancel"), style: "cancel" },
  //       {
  //         text: translate("common.delete"),
  //         style: "destructive",
  //         onPress: () => authStore.deleteAccount(),
  //       },
  //     ],
  //   )
  // }

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
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
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
      <Divider tx="userSettingsScreen.accountControlsSectionLabel" orientation="horizontal" />
      <Button preset="text" tx="userSettingsScreen.logoutAlertTitle" onPress={showLogoutAlert} />
      {/* <Button
        preset="text"
        style={$deleteAccountButton}
        textStyle={{ color: themeStore.colors("danger") }}
        tx="userSettingsScreen.deleteAccountAlertTitle"
        onPress={showDeleteAlert}
      /> */}
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  ...styles.screenContainer,
  paddingHorizontal: spacing.large,
}

// const $deleteAccountButton: ViewStyle = {
//   marginVertical: spacing.large,
// }
