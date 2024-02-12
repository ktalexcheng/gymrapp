import { useFocusEffect } from "@react-navigation/native"
import {
  Button,
  CustomIcon,
  Divider,
  Icon,
  Screen,
  Spacer,
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
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Image, ImageStyle, Platform, TextInput, TextStyle, View, ViewStyle } from "react-native"

const googleGLogo = require("../../../assets/images/google-g-logo.png")

interface SignInScreenProps extends AuthStackScreenProps<"SignIn"> {}

export const SignInScreen: FC<SignInScreenProps> = observer(function SignInScreen() {
  const authNavigation = useAuthNavigation()
  const { authenticationStore: authStore, themeStore } = useStores()
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [authError, setAuthError] = useState<string>()
  const loginPasswordRef = useRef<TextInput>(null)

  useFocusEffect(
    useCallback(() => {
      authStore.resetAuthError()
      setAuthError(undefined)
    }, []),
  )

  useEffect(() => {
    console.debug("SignInScreen: Auth error changed", authStore.authError)
    if (authStore.authError) {
      setAuthError(translate(AuthErrorTxKey[authStore.authError]))
    }
  }, [authStore.authError])

  function validateForm() {
    let isValid = true

    if (
      !loginEmail ||
      !loginPassword ||
      authStore.emailIsInvalid(loginEmail) ||
      authStore.passwordIsWeak(loginPassword)
    ) {
      setAuthError(translate("signInScreen.error.invalidCredentials"))
      isValid = false
    } else {
      setAuthError(undefined)
    }

    return isValid
  }

  function signIn() {
    setAttemptsCount(attemptsCount + 1)
    if (!validateForm()) {
      return
    }

    authStore.setLoginEmail(loginEmail)
    authStore.setLoginPassword(loginPassword)
    authStore
      .signInWithEmail()
      .then(() => {
        if (authStore.isPendingVerification) {
          authNavigation.reset({
            index: 0,
            routes: [{ name: "EmailVerification", params: { email: authStore.email } }],
          })
        }
      })
      .catch()
  }

  const PasswordRightAccessory = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <CustomIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={themeStore.palette("neutral800")}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden],
  )

  const $identityProviderButton: ViewStyle = {
    // borderColor: themeStore.isDark ? "#8E918F" : "#747775",
    borderColor: themeStore.isDark ? "#00000000" : "#747775",
    backgroundColor: themeStore.isDark ? "#131314" : "#FFFFFF",
    ...$continueWithButton,
  }

  const $identityProviderText: TextStyle = {
    color: themeStore.isDark ? "#E3E3E3" : "#1F1F1F",
    // fontSize: 14,
    // lineHeight: 20,
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
      isBusy={authStore.isAuthenticating}
    >
      <View style={styles.screenTitleMinHeight}>
        <Text testID="signIn-heading" tx="signInScreen.signIn" preset="heading" />
      </View>

      <View>
        <TextField
          value={loginEmail}
          onChangeText={setLoginEmail}
          containerStyle={$textField}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          labelTx="signInScreen.emailFieldLabel"
          placeholderTx="signInScreen.emailFieldPlaceholder"
          onSubmitEditing={() => loginPasswordRef.current?.focus()}
        />

        <TextField
          ref={loginPasswordRef}
          value={loginPassword}
          onChangeText={setLoginPassword}
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

        {!!authError && (
          <Text preset="danger" text={authError} style={{ marginVertical: spacing.small }} />
        )}

        <Button
          testID="signIn-button"
          tx="signInScreen.tapToSignIn"
          preset="reversed"
          onPress={signIn}
        />

        <Divider orientation="horizontal" tx="signInScreen.orSignInWith" />

        <View>
          <Button
            tx="signInScreen.signInWithGoogle"
            style={$identityProviderButton}
            textStyle={$identityProviderText}
            onPress={authStore.signInWithGoogle}
            LeftAccessory={() => <Image source={googleGLogo} style={$identityProviderIcon} />}
          />

          <Spacer type="vertical" size="small" />

          {Platform.OS === "ios" && (
            <Button
              tx="signInScreen.signInWithApple"
              style={$identityProviderButton}
              textStyle={$identityProviderText}
              onPress={authStore.signInWithApple}
              LeftAccessory={() => (
                <Icon
                  name="logo-apple"
                  size={20}
                  color={themeStore.isDark ? "white" : "black"}
                  style={[$identityProviderIcon, $appleIconAdjustment]}
                />
              )}
            />
          )}
        </View>

        <Spacer type="vertical" size="small" />

        <Button
          testID="signup-button"
          tx="signInScreen.signUpWithEmail"
          preset="text"
          onPress={() => authNavigation.navigate("SignUp")}
        />
      </View>
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  padding: spacing.screenPadding,
}

const $textField: ViewStyle = {
  marginBottom: spacing.large,
}

const $continueWithButton: ViewStyle = { width: "100%", height: 44 }

const $identityProviderIcon: ImageStyle = {
  height: 20,
  width: 20,
  marginRight: 12,
}

// The official Apple icon looks misaligned when centered with the text,
// this is a quick fix to adjust it
const $appleIconAdjustment: ViewStyle = {
  marginBottom: 4,
}
