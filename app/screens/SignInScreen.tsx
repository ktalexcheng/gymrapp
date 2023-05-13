import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"
import React, { FC, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AuthStackParamList, AuthStackScreenProps } from "../navigators"
import { colors, spacing } from "../theme"

interface SignInScreenProps extends AuthStackScreenProps<"SignIn"> {}

export const SignInScreen: FC<SignInScreenProps> = observer(function SignInScreen(_props) {
  const authPasswordInput = useRef<TextInput>()
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const {
    authenticationStore: {
      authEmail,
      authPassword,
      setAuthEmail,
      setAuthPassword,
      signInWithEmail,
      validationError,
      storeError,
      signInWithGoogle,
    },
  } = useStores()
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>()

  // useEffect(() => {
  //   // TODO: Here is where you could fetch credentials from keychain or storage
  //   // and pre-fill the form fields.
  //   setAuthEmail("ignite@infinite.red")
  //   setAuthPassword("ign1teIsAwes0m3")
  // }, [])

  const error = isSubmitted ? validationError : ""

  function signIn() {
    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)

    if (validationError) return

    // Make a request to your server to get an authentication token.
    // If successful, reset the fields and set the token.
    setIsSubmitted(false)
    setAuthEmail(authEmail)
    setAuthPassword(authPassword)
    signInWithEmail()

    // We'll mock this with a fake token.
    // setAuthToken(String(Date.now()))
  }

  const PasswordRightAccessory = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden],
  )

  // useEffect(() => {
  //   return () => {
  //     setAuthPassword("")
  //     setAuthEmail("")
  //   }
  // }, [])

  return (
    <Screen
      preset="auto"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text testID="signIn-heading" tx="signInScreen.signIn" preset="heading" style={$signIn} />
      <Text tx="signInScreen.enterDetails" preset="subheading" style={$enterDetails} />
      {/* {attemptsCount > 2 && <Text tx="signInScreen.hint" size="sm" weight="light" style={$hint} />} */}
      {storeError && (
        <Text size="sm" weight="light" style={$hint}>
          {storeError}
        </Text>
      )}

      <TextField
        value={authEmail}
        onChangeText={setAuthEmail}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="signInScreen.emailFieldLabel"
        placeholderTx="signInScreen.emailFieldPlaceholder"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => authPasswordInput.current?.focus()}
      />

      <TextField
        ref={authPasswordInput}
        value={authPassword}
        onChangeText={setAuthPassword}
        containerStyle={$textField}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isAuthPasswordHidden}
        labelTx="signInScreen.passwordFieldLabel"
        placeholderTx="signInScreen.passwordFieldPlaceholder"
        onSubmitEditing={signIn}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="signIn-button"
        tx="signInScreen.tapToSignIn"
        style={$tapButton}
        preset="reversed"
        onPress={signIn}
      />

      <Button
        testID="signup-button"
        tx="signInScreen.tapToSignUp"
        style={$tapButton}
        onPress={() => navigation.navigate("SignUp")}
      />

      <Button
        testID="createAccount-google"
        tx="signInScreen.signInWithGoogle"
        style={$tapButton}
        onPress={signInWithGoogle}
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

const $enterDetails: TextStyle = {
  marginBottom: spacing.large,
}

const $hint: TextStyle = {
  color: colors.tint,
  marginBottom: spacing.medium,
}

const $textField: ViewStyle = {
  marginBottom: spacing.large,
}

const $tapButton: ViewStyle = {
  marginTop: spacing.extraSmall,
}
