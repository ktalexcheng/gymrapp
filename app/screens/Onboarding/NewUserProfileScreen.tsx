import { Button, Icon, Screen, TextField } from "app/components"
import { User } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import React, { useRef, useState } from "react"
import { TextInput, ViewStyle } from "react-native"
import { SwitchSettingTile } from "../UserSettingsScreen"

export const NewUserProfileScreen = () => {
  const { authenticationStore: authStore, userStore } = useStores()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [privateAccount, setPrivateAccount] = useState(false)
  const [firstNameError, setFirstNameError] = useState(false)
  const [lastNameError, setLastNameError] = useState(false)
  const lastNameInputRef = useRef<TextInput>()
  const mainNavigator = useMainNavigation()

  const isInvalidForm = () => {
    let errorFound = false

    if (firstName.length === 0) {
      setFirstNameError(true)
      errorFound = true
    }
    if (lastName.length === 0) {
      setLastNameError(true)
      errorFound = true
    }

    return errorFound
  }

  const createProfile = async () => {
    if (isInvalidForm()) return

    if (userStore.userProfileExists) {
      await userStore.updateProfile({
        firstName,
        lastName,
        privateAccount,
      } as Partial<User>)
    } else {
      await userStore.createNewProfile({
        userId: authStore.firebaseUser.uid,
        privateAccount: true,
        email: authStore.firebaseUser.email,
        firstName,
        lastName,
        providerId: authStore.firebaseUser?.providerId ?? "",
        photoUrl: null, // TODO: Allow user to upload profile picture
      } as User)
    }

    mainNavigator.navigate("HomeTabNavigator")
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} style={$screenContentContainer}>
      <TextField
        status={firstNameError ? "error" : null}
        value={firstName}
        onChangeText={setFirstName}
        containerStyle={$textField}
        autoCapitalize="words"
        autoCorrect={false}
        labelTx="signUpScreen.firstNameLabel"
        onSubmitEditing={() => lastNameInputRef.current?.focus()}
      />

      <TextField
        status={lastNameError ? "error" : null}
        value={lastName}
        onChangeText={setLastName}
        containerStyle={$textField}
        autoCapitalize="words"
        autoCorrect={false}
        labelTx="signUpScreen.lastNameLabel"
      />

      <SwitchSettingTile
        titleTx="userSettingsScreen.privateAccountTitle"
        descriptionTx="userSettingsScreen.privateAccountDescription"
        toggleState={privateAccount}
        isOffIcon={<Icon name="lock-open-outline" size={30} />}
        isOnIcon={<Icon name="lock-closed" size={30} />}
        onToggle={() => setPrivateAccount(!privateAccount)}
      />

      <Button tx="onboarding.createProfile" onPress={createProfile} />
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}

const $textField: ViewStyle = {
  marginBottom: spacing.large,
}
