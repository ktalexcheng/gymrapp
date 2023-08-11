import { Avatar, Button, Icon, Screen, Text, TextField } from "app/components"
import { AppLanguage, User } from "app/data/model"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import * as ImagePicker from "expo-image-picker"
import React, { useEffect, useRef, useState } from "react"
import { ImageStyle, TextInput, TouchableOpacity, ViewStyle } from "react-native"
import { LoadingScreen } from "../LoadingScreen"
import { SwitchSettingTile } from "../UserSettingsScreen"

export const CreateProfileScreen = () => {
  const mainNavigator = useMainNavigation()
  const { authenticationStore: authStore, userStore } = useStores()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [imagePath, setImagePath] = useState(null)
  const [privateAccount, setPrivateAccount] = useState(false)
  const [firstNameError, setFirstNameError] = useState(false)
  const [lastNameError, setLastNameError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const lastNameInputRef = useRef<TextInput>()

  useEffect(() => {
    if (userStore.user) {
      setFirstName(userStore.user.firstName)
      setLastName(userStore.user.lastName)
      setImagePath(userStore.user.avatarUrl)
    }
  }, [userStore.user])

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setImagePath(result.assets[0].uri)
      }
    } catch (e) {
      console.error("CreateProfileScreen.pickImage error:", e)
    }
  }

  const createProfile = async () => {
    if (isInvalidForm()) return

    setIsProcessing(true)

    try {
      const initialUser = {
        firstName,
        lastName,
        privateAccount,
      } as User

      if (imagePath) {
        const avatarUrl = await userStore.uploadUserAvatar(imagePath)
        initialUser.avatarUrl = avatarUrl
      } else {
        initialUser.avatarUrl = null
      }

      if (userStore.userProfileExists) {
        await userStore.updateProfile(initialUser)
      } else {
        // User profile should already be created upon sign up,
        // this condition should only be possible during development
        initialUser.userId = authStore.firebaseUser.uid
        initialUser.email = authStore.firebaseUser.email
        initialUser.providerId = authStore.firebaseUser?.providerId ?? ""
        initialUser.preferences = {
          appLocale: AppLanguage.en_US, // TODO: Default to match user system setting
        }

        await userStore.createNewProfile(initialUser)
      }

      mainNavigator.navigate("HomeTabNavigator")
    } catch (e) {
      console.error("CreateProfileScreen.createProfile error:", e)
    }

    setIsProcessing(false)
  }

  if (isProcessing) {
    return <LoadingScreen />
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} style={$screenContentContainer}>
      <Text tx="onboarding.onboardingTitle" preset="heading" />

      <Text tx="onboarding.uploadAvatarTitle" preset="subheading" />
      <TouchableOpacity style={$avatar} onPress={pickImage}>
        <Avatar user={userStore.user} size="2xl" />
      </TouchableOpacity>

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

const $avatar: ImageStyle = {
  alignSelf: "center",
}
