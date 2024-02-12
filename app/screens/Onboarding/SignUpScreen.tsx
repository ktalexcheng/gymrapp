import { useFocusEffect } from "@react-navigation/native"
import {
  Button,
  CustomIcon,
  Screen,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "app/components"
import { AuthErrorTxKey } from "app/data/constants"
import { translate } from "app/i18n"
import { AuthStackScreenProps } from "app/navigators"
import { useAuthNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { spacing, styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"

interface SignUpScreenProps extends AuthStackScreenProps<"SignUp"> {}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen() {
  const authNavigation = useAuthNavigation()
  const { authenticationStore: authStore, themeStore } = useStores()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const newLastNameInputRef = useRef<TextInput>(null)
  const newEmailInputRef = useRef<TextInput>(null)
  const newPasswordInputRef = useRef<TextInput>(null)
  const confirmPasswordInputRef = useRef<TextInput>(null)
  const [firstNameError, setFirstNameError] = useState<string>()
  const [lastNameError, setLastNameError] = useState<string>()
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>()

  useFocusEffect(
    useCallback(() => {
      authStore.resetAuthError()
    }, []),
  )

  function validateForm() {
    let isValid = true

    if (!newFirstName) {
      setFirstNameError(translate("signUpScreen.error.firstNameMissing"))
      isValid = false
    } else {
      setFirstNameError(undefined)
    }

    if (!newLastName) {
      setLastNameError(translate("signUpScreen.error.lastNameMissing"))
      isValid = false
    } else {
      setLastNameError(undefined)
    }

    if (!newEmail) {
      setEmailError(translate("signUpScreen.error.emailMissing"))
      isValid = false
    } else if (authStore.emailIsInvalid(newEmail)) {
      setEmailError(translate("signUpScreen.error.emailInvalid"))
      isValid = false
    } else {
      setEmailError(undefined)
    }

    if (!newPassword) {
      setPasswordError(translate("signUpScreen.error.passwordMissing"))
      isValid = false
    } else if (authStore.passwordIsWeak(newPassword)) {
      setPasswordError(translate("signUpScreen.error.passwordInsecure"))
      isValid = false
    } else {
      setPasswordError(undefined)
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(translate("signUpScreen.error.passwordMismatch"))
      isValid = false
    } else {
      setConfirmPasswordError(undefined)
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
      setConfirmPasswordError(translate("signUpScreen.error.passwordMismatch"))
      return
    } else {
      setConfirmPasswordError(undefined)
    }

    authStore
      .signUpWithEmail()
      .then(() => {
        console.debug("Navigating to EmailVerification after signUpWithEmail")
        authNavigation.navigate("EmailVerification", { email: newEmail })
      })
      .catch((e) => {
        console.debug("Caught error signing up with email")
        if (e.code === "auth/email-already-in-use") {
          // If error is email in use, set email error
          setEmailError(translate(AuthErrorTxKey["email-already-in-use"]))
        }
      })
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
          helper={firstNameError}
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
          helper={lastNameError}
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
          helper={emailError}
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
          helper={confirmPasswordError}
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
