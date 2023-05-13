import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "app/components"
import { useStores } from "app/models"
import { AuthStackScreenProps } from "app/navigators"
import { observer } from "mobx-react-lite"
import React, { FC, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { colors, spacing } from "../theme"

interface SignUpScreenProps extends NativeStackScreenProps<AuthStackScreenProps<"SignUp">> {}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen() {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()
  const {
    authenticationStore: {
      authEmail,
      authPassword,
      setAuthEmail,
      setAuthPassword,
      signUpWithEmail,
      validationError,
    },
  } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>()

  const newPasswordInput = useRef<TextInput>()

  const [isNewPasswordHidden, setIsNewPasswordHidden] = useState(true)

  // const error = isSubmitted ? validationError : ""?
  const error = ""

  function createNewAccount() {
    if (validationError) return

    setAuthEmail(authEmail)
    setAuthPassword(authPassword)
    signUpWithEmail()
  }

  const PasswordRightAccessory = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
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

      <TextField
        value={authEmail}
        onChangeText={setAuthEmail}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="signUpScreen.emailFieldLabel"
        placeholderTx="signUpScreen.emailFieldPlaceholder"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => newPasswordInput.current?.focus()}
      />

      <TextField
        ref={newPasswordInput}
        value={authPassword}
        onChangeText={setAuthPassword}
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
