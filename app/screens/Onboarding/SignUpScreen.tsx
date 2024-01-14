import { NativeStackScreenProps } from "@react-navigation/native-stack"
import {
  Button,
  CustomIcon,
  Screen,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "app/components"
import { AuthErrorTxKey, AuthErrorType } from "app/data/constants"
import { translate } from "app/i18n"
import { AuthStackScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"
import Toast from "react-native-root-toast"

interface SignUpScreenProps extends NativeStackScreenProps<AuthStackScreenProps<"SignUp">> {}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen() {
  const { authenticationStore: authStore, themeStore } = useStores()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const newLastNameInputRef = useRef<TextInput>()
  const newEmailInputRef = useRef<TextInput>()
  const newPasswordInputRef = useRef<TextInput>()
  const confirmPasswordInputRef = useRef<TextInput>()
  const [firstNameError, setFirstNameError] = useState(null)
  const [lastNameError, setLastNameError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState(null)

  useEffect(() => {
    authStore.resetAuthError()
  }, [])

  useEffect(() => {
    if (authStore.authError) {
      // If error is email in use, set email error
      if (authStore.authError === AuthErrorType.EmailDuplicateError) {
        setEmailError(translate(AuthErrorTxKey[authStore.authError]))
      }

      Toast.show(translate(AuthErrorTxKey[authStore.authError]), {
        onHidden: () => {
          authStore.resetAuthError()
        },
      })
    }
  }, [authStore.authError])

  function validateForm() {
    let isValid = true

    if (!newFirstName) {
      setFirstNameError(translate("signUpScreen.error.firstNameMissing"))
      isValid = false
    } else {
      setFirstNameError(null)
    }

    if (!newLastName) {
      setLastNameError(translate("signUpScreen.error.lastNameMissing"))
      isValid = false
    } else {
      setLastNameError(null)
    }

    if (!newEmail) {
      setEmailError(translate("signUpScreen.error.emailMissing"))
      isValid = false
    } else if (authStore.emailIsInvalid(newEmail)) {
      setEmailError(translate("signUpScreen.error.emailInvalid"))
      isValid = false
    } else {
      setEmailError(null)
    }

    if (!newPassword) {
      setPasswordError(translate("signUpScreen.error.passwordMissing"))
      isValid = false
    } else if (authStore.passwordIsWeak(newPassword)) {
      setPasswordError(translate("signUpScreen.error.passwordInsecure"))
      isValid = false
    } else {
      setPasswordError(null)
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(translate("signUpScreen.error.passwordMismatch"))
      isValid = false
    } else {
      setConfirmPasswordError(null)
    }

    return isValid
  }

  function createNewAccount() {
    setAttemptsCount(attemptsCount + 1)
    if (!validateForm()) {
      return
    }

    authStore.setLoginEmail(newEmail)
    authStore.setLoginPassword(newPassword)
    authStore.setNewFirstName(newFirstName)
    authStore.setNewLastName(newLastName)

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(true)
      return
    } else {
      setConfirmPasswordError(false)
    }

    authStore.signUpWithEmail()
  }

  const PasswordRightAccessory = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <CustomIcon
            icon={isNewPasswordHidden ? "view" : "hidden"}
            color={themeStore.palette("neutral800")}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsNewPasswordHidden(!isNewPasswordHidden)}
          />
        )
      },
    [isNewPasswordHidden],
  )

  const ConfirmPasswordRightAccessory = useMemo(
    () =>
      function ConfirmPasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <CustomIcon
            icon={isConfirmPasswordHidden ? "view" : "hidden"}
            color={themeStore.palette("neutral800")}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
          />
        )
      },
    [isConfirmPasswordHidden],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
      isBusy={authStore.isAuthenticating}
    >
      <View style={styles.screenTitleMinHeight}>
        <Text testID="signIn-heading" tx="signUpScreen.signUp" preset="heading" style={$signIn} />
      </View>

      <View>
        <TextField
          value={newFirstName}
          onChangeText={setNewFirstName}
          containerStyle={$textField}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.firstName"
          placeholderTx="signUpScreen.firstNamePlaceholder"
          status={firstNameError ? "error" : undefined}
          helper={!!firstNameError && firstNameError}
          onSubmitEditing={() => newLastNameInputRef.current?.focus()}
        />

        <TextField
          ref={newLastNameInputRef}
          value={newLastName}
          onChangeText={setNewLastName}
          containerStyle={$textField}
          autoCapitalize="words"
          autoCorrect={false}
          labelTx="common.lastName"
          placeholderTx="signUpScreen.lastNamePlaceholder"
          status={lastNameError ? "error" : undefined}
          helper={!!lastNameError && lastNameError}
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
          status={emailError ? "error" : undefined}
          helper={!!emailError && emailError}
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
          status={passwordError ? "error" : undefined}
          helper={passwordError || translate("signUpScreen.passwordFieldHint")}
          onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          RightAccessory={PasswordRightAccessory}
        />

        <TextField
          ref={confirmPasswordInputRef}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={$textField}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={isConfirmPasswordHidden}
          labelTx="signUpScreen.confirmPasswordFieldLabel"
          placeholderTx="signUpScreen.confirmPasswordFieldPlaceholder"
          status={confirmPasswordError ? "error" : undefined}
          helper={!!confirmPasswordError && confirmPasswordError}
          onSubmitEditing={createNewAccount}
          RightAccessory={ConfirmPasswordRightAccessory}
        />

        <Button
          tx="signUpScreen.tapToCreateAccount"
          style={$tapButton}
          onPress={createNewAccount}
        />
      </View>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  padding: spacing.screenPadding,
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
