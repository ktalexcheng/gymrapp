import { Avatar, Icon, RowView, TextField } from "app/components"
import { User } from "app/data/types"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { logError } from "app/utils/logger"
import * as ImagePicker from "expo-image-picker"
import React, { useRef } from "react"
import { ImageStyle, TextInput, TouchableOpacity, View, ViewStyle } from "react-native"

type AboutYouFormProps = {
  userHandleHelper?: string
  userProfile: Partial<User>
  onUserProfileChange: (user: Partial<User>) => void
  userHandleError?: string
  firstNameError?: string
  lastNameError?: string
}

export const AboutYouForm = (props: AboutYouFormProps) => {
  const {
    userHandleHelper,
    userProfile,
    onUserProfileChange,
    userHandleError,
    firstNameError,
    lastNameError,
  } = props
  const { userStore, themeStore } = useStores()

  // Derived states
  const avatarImagePath = userProfile?.avatarUrl
  const userHandle = userProfile?.userHandle
  const firstName = userProfile?.firstName
  const lastName = userProfile?.lastName

  // Form input values
  const firstNameInputRef = useRef<TextInput>(null)
  const lastNameInputRef = useRef<TextInput>(null)

  const onUserHandleChange = (userHandle?: string) => {
    onUserProfileChange({ userHandle })
  }

  const onFirstNameChange = (firstName?: string) => {
    onUserProfileChange({ firstName })
  }

  const onLastNameChange = (lastName?: string) => {
    onUserProfileChange({ lastName })
  }

  const removeAvatar = () => {
    onUserProfileChange({ avatarUrl: undefined })
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
        console.debug("EditProfileForm.pickImage: image picked successfully", {
          uri: result.assets[0].uri,
        })
        onUserProfileChange({ avatarUrl: result.assets[0].uri })
      }
    } catch (e) {
      logError(e, "EditProfileForm.pickImage error")
    }
  }

  return (
    <View style={$formFieldGap}>
      <View style={$avatar}>
        <View>
          <Icon
            name="close-circle"
            style={$removeAvatarButton}
            onPress={removeAvatar}
            color={themeStore.colors("tint")}
            size={30}
          />
          <TouchableOpacity onPress={pickImage}>
            <Avatar imageUrl={avatarImagePath} user={userStore.user} size="xxl" />
          </TouchableOpacity>
        </View>
      </View>
      <TextField
        status={userHandleError ? "error" : null}
        value={userHandle}
        onChangeText={onUserHandleChange}
        autoCapitalize="none"
        autoCorrect={false}
        labelTx="editProfileForm.userHandleLabel"
        onSubmitEditing={() => firstNameInputRef.current?.focus()}
        helper={userHandleError ?? userHandleHelper}
      />
      <RowView style={$formFieldGap}>
        <TextField
          ref={firstNameInputRef}
          status={firstNameError ? "error" : null}
          value={firstName}
          onChangeText={onFirstNameChange}
          containerStyle={styles.flex1}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.firstName"
          onSubmitEditing={() => lastNameInputRef.current?.focus()}
          helper={firstNameError}
        />
        <TextField
          ref={lastNameInputRef}
          status={lastNameError ? "error" : null}
          value={lastName}
          onChangeText={onLastNameChange}
          containerStyle={styles.flex1}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.lastName"
          helper={lastNameError}
        />
      </RowView>
    </View>
  )
}

const $avatar: ImageStyle = {
  alignSelf: "center",
  paddingVertical: spacing.large,
}

const $removeAvatarButton: ImageStyle = {
  position: "absolute",
  zIndex: 1,
}

const $formFieldGap: ViewStyle = {
  gap: spacing.small,
}
