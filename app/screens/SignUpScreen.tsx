import { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Button,
  CustomIcon,
  Screen,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "app/components"
import { User } from "app/data/model"
import { AuthStackScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { colors, spacing } from "../theme"

interface SignUpScreenProps extends NativeStackScreenProps<AuthStackScreenProps<"SignUp">> {}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen() {
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { authenticationStore: authStore } = useStores()
  const newLastNameInputRef = useRef<TextInput>()
  const newEmailInputRef = useRef<TextInput>()
  const newPasswordInputRef = useRef<TextInput>()

  useEffect(() => {
    authStore.resetAuthError()
  }, [])
  const error = isSubmitted ? authStore.validationError : ""

  function createNewAccount() {
    setIsSubmitted(true)
    const newUser: User = {
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
    }
    authStore.setUser(newUser)
    authStore.setPassword(newPassword)

    if (authStore.validationError) return

    authStore.signUpWithEmail()
    setIsSubmitted(false)
  }

  const PasswordRightAccessory = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <CustomIcon
            icon={isNewPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsNewPasswordHidden(!isNewPasswordHidden)}
          />
        )
      },
    [isNewPasswordHidden],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text testID="signIn-heading" tx="signUpScreen.signUp" preset="heading" style={$signIn} />

      {authStore.authError && (
        <Text size="sm" weight="light" style={$hint}>
          {authStore.authError}
        </Text>
      )}

      <TextField
        value={newFirstName}
        onChangeText={setNewFirstName}
        containerStyle={$textField}
        autoCapitalize="words"
        autoCorrect={false}
        labelTx="signUpScreen.firstNameLabel"
        onSubmitEditing={() => newLastNameInputRef.current?.focus()}
      />

      <TextField
        ref={newLastNameInputRef}
        value={newLastName}
        onChangeText={setNewLastName}
        containerStyle={$textField}
        autoCapitalize="words"
        autoCorrect={false}
        labelTx="signUpScreen.lastNameLabel"
        onSubmitEditing={() => newEmailInputRef.current?.focus()}
      />

      <TextField
        ref={newEmailInputRef}
        value={newEmail}
        onChangeText={setNewEmail}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="signUpScreen.emailFieldLabel"
        placeholderTx="signUpScreen.emailFieldPlaceholder"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => newPasswordInputRef.current?.focus()}
      />

      <TextField
        ref={newPasswordInputRef}
        value={newPassword}
        onChangeText={setNewPassword}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isNewPasswordHidden}
        labelTx="signUpScreen.passwordFieldLabel"
        placeholderTx="signUpScreen.passwordFieldPlaceholder"
        onSubmitEditing={createNewAccount}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="createAccount-email"
        tx="signUpScreen.tapToCreateAccount"
        style={$tapButton}
        onPress={createNewAccount}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.huge,
  paddingHorizontal: spacing.large,
}

const $signIn: TextStyle = {
  marginBottom: spacing.small,
}

const $textField: ViewStyle = {
  marginBottom: spacing.large,
}

const $tapButton: ViewStyle = {
  marginTop: spacing.extraSmall,
}

const $hint: TextStyle = {
  color: colors.tint,
  marginBottom: spacing.medium,
}
