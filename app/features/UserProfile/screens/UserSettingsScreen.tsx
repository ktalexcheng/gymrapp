import { useFocusEffect } from "@react-navigation/native"
import {
  Button,
  Divider,
  MenuListItem,
  Modal,
  Screen,
  Spacer,
  Text,
  TextField,
} from "app/components"
import { useToast, useUserProfileEdit } from "app/hooks"
import { translate } from "app/i18n"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import * as Application from "expo-application"
import * as Device from "expo-device"
import { observer } from "mobx-react-lite"
import React, { useEffect, useState } from "react"
import { Alert, BackHandler, View } from "react-native"
import { AboutYouForm } from "../components/AboutYouForm"
import { UserPreferencesMenu } from "../components/UserPreferencesMenu"

export const UserSettingsScreen = observer(function () {
  const { authenticationStore: authStore } = useStores()
  const mainNavigation = useMainNavigation()
  const [loginPassword, setLoginPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const {
    userProfile,
    setUserProfile,
    // isInvalidUserInfo,
    saveUserProfile,
    isSaving,
    isSaved,
    isDirty,
    userHandleHelper,
    userHandleError,
    firstNameMissingError,
    lastNameMissingError,
  } = useUserProfileEdit()
  const [toastShowTx] = useToast()

  // EditProfileForm is the same component for both CreateProfileScreen and UserSettingsScreen
  // so we need to check if the user is creating a new profile or editing an existing one
  // user will not be allowed to go back if they are creating a new profile
  const confirmDiscardChanges = () => {
    console.debug("EditProfileForm.confirmDiscardChanges:", { isDirty })
    if (!isDirty) {
      if (mainNavigation.canGoBack()) mainNavigation.goBack()
      return
    }

    Alert.alert(
      translate("editProfileForm.discardAlertTitle"),
      translate("editProfileForm.discardAlertMessage"),
      [
        { text: translate("editProfileForm.alertDialogResume"), style: "cancel" },
        {
          text: translate("common.discard"),
          style: "destructive",
          onPress: () => {
            if (mainNavigation.canGoBack()) mainNavigation.goBack()
          },
        },
      ],
    )
  }

  // The listener seems to only work with Android's native-stack, but not on iOS
  // So we need to disable gesture (for iOS swipe back) and disable header back button in MainNavigator
  // to force the user to use the save or discard buttons
  // UPDATE: This is too much hassle, disabling the back button for android too
  useFocusEffect(() => {
    // React Navigation will keep the screen mounted when we navigate to the next screen (e.g. when we go to the add to my gyms screen)
    // so we need to use useFocusEffect to add the listener only when the screen is focused
    if (Device.osName === "ios") return undefined

    const backPressListener = BackHandler.addEventListener("hardwareBackPress", () => {
      toastShowTx("editProfileForm.backButtonDisabledMessage")
      return true
    })

    return () => backPressListener.remove()
  })

  useEffect(() => {
    if (isDirty) {
      mainNavigation.setOptions({
        headerBackVisible: false,
        headerLeft: () => (
          <Button
            tx="common.discard"
            onPress={confirmDiscardChanges}
            preset="text"
            style={{ minHeight: 0 }} // eslint-disable-line
          />
        ),
        headerTitleAlign: "center",
        headerRight: () => (
          <Button
            tx="common.save"
            onPress={saveUserProfile}
            preset="text"
            style={{ minHeight: 0 }} // eslint-disable-line
          />
        ),
      })
    } else {
      mainNavigation.setOptions({
        headerBackVisible: true,
        headerLeft: undefined,
        headerRight: undefined,
      })
    }
  }, [isDirty, confirmDiscardChanges, saveUserProfile])

  useEffect(() => {
    // The listener for navigation's 'beforeRemove' event
    // could be called multiple times rapidly, so we need to check if we can go back
    if (isSaved && mainNavigation.canGoBack()) mainNavigation.goBack()
  }, [isSaved])

  const showDeleteAlert = () => {
    Alert.alert(
      translate("userSettingsScreen.deleteAccountAlertTitle"),
      translate("userSettingsScreen.deleteAccountAlertMessage"),
      [
        { text: translate("common.cancel"), style: "cancel" },
        {
          text: translate("common.ok"),
          style: "destructive",
          onPress: onConfirmDeleteAccount,
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
          onPress: () => {
            setIsBusy(true)
            authStore.logout().finally(() => setIsBusy(false))
          },
        },
      ],
    )
  }

  const onConfirmDeleteAccount = () => {
    if (authStore.providerId === "password") {
      setShowConfirmPassword(true)
    } else {
      authStore.deleteAccount(loginPassword)
    }
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      contentContainerStyle={styles.screenContainer}
      isBusy={isSaving || isBusy}
    >
      <Modal
        animationType="slide"
        visible={showConfirmPassword}
        transparent={true}
        onRequestClose={() => setShowConfirmPassword(false)}
      >
        <TextField
          value={loginPassword}
          onChangeText={setLoginPassword}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={true}
          labelTx="userSettingsScreen.deleteAccountPasswordPrompt"
          placeholderTx="signInScreen.passwordFieldPlaceholder"
        />
        <Button
          preset="text"
          tx="common.ok"
          onPress={() => {
            setShowConfirmPassword(false)
            authStore.deleteAccount(loginPassword)
            setLoginPassword("")
          }}
        />
      </Modal>

      <Text tx="editProfileForm.aboutYouSectionLabel" preset="subheading" />
      <AboutYouForm
        userProfile={userProfile}
        onUserProfileChange={setUserProfile}
        userHandleHelper={userHandleHelper}
        userHandleError={userHandleError}
        firstNameError={firstNameMissingError}
        lastNameError={lastNameMissingError}
      />

      <Spacer type="vertical" size="large" />

      <Text tx="editProfileForm.preferencesSectionLabel" preset="subheading" />
      <Spacer type="vertical" size="small" />
      <UserPreferencesMenu
        privateAccount={userProfile.privateAccount!}
        onPrivateAccountChange={(privateAccount) => setUserProfile({ privateAccount })}
        userPreferences={userProfile.preferences!}
        onUserPreferencesChange={(preferences) => setUserProfile({ preferences })}
        additionalMenuItems={[
          {
            positionIndex: 0,
            menuListItemProps: {
              id: "myGyms",
              itemNameLabelTx: "editProfileForm.myGymsLabel",
              currentValue: userProfile?.myGyms?.length ?? 0,
              onPress: () => mainNavigation.navigate("ManageMyGyms"),
            },
          },
          // {
          //   positionIndex: 1,
          //   menuListItemProps: {
          //     itemId: "exerciseSettings",
          //     itemNameLabelTx: "editProfileForm.exerciseSettingsLabel",
          //     currentValue: null,
          //     overrideOnPress: () => mainNavigation.navigate("ManageExerciseSettings"),
          //   },
          // },
        ]}
      />

      <Divider
        tx="userSettingsScreen.accountControlsSectionLabel"
        orientation="horizontal"
        spaceSize={30}
      />

      <View style={{ gap: spacing.medium }}>
        <MenuListItem
          itemNameLabelTx={"userSettingsScreen.logoutAlertTitle"}
          currentValue={undefined}
          onPress={showLogoutAlert}
        />
        <Spacer type="vertical" size="medium" />
        <View style={styles.disabled}>
          <MenuListItem
            itemNameLabelTx={"userSettingsScreen.deleteAccountAlertTitle"}
            currentValue={undefined}
            onPress={showDeleteAlert}
          />
        </View>
      </View>

      <Divider
        tx="userSettingsScreen.aboutGymrappSectionLabel"
        orientation="horizontal"
        spaceSize={30}
      />

      <View style={{ gap: spacing.large }}>
        <MenuListItem
          itemNameLabelTx={"userSettingsScreen.accountAuthenticationTypeLabel"}
          currentValue={(() => {
            let tx
            switch (authStore.providerId) {
              case "apple.com":
                tx = "signInScreen.signInWithApple"
                break
              case "google.com":
                tx = "signInScreen.signInWithGoogle"
                break
              default:
                tx = "userSettingsScreen.emailPassword"
                break
            }
            return translate(tx)
          })()}
          onPress={() => {}}
          OverrideRightAccessory={() => null}
        />
        <MenuListItem
          itemNameLabelTx={"userSettingsScreen.appVersionLabel"}
          currentValue={`${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
          onPress={() => {}}
          OverrideRightAccessory={() => null}
        />
      </View>
    </Screen>
  )
})
