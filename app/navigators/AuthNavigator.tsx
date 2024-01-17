import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { AuthErrorTxKey } from "app/data/constants"
import { translate } from "app/i18n"
import {
  EmailVerificationScreen,
  EmailVerifiedScreen,
  SignInScreen,
  SignUpScreen,
  WelcomeScreen,
} from "app/screens"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import Toast from "react-native-root-toast"
import { useAuthNavigation } from "./navigationUtilities"

export type AuthStackParamList = {
  Welcome: undefined
  SignIn: undefined
  SignUp: undefined
  EmailVerification: { email: string }
  EmailVerified: undefined
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator = observer(() => {
  const authNavigation = useAuthNavigation()
  const { authenticationStore: authStore } = useStores()

  useEffect(() => {
    console.debug("AuthNavigator: Checking if pending verification")
    if (authStore.isPendingVerification) {
      console.debug(
        "AuthNavigator: Authenticated but pending verification, redirecting to EmailVerificationScreen",
      )
      authNavigation.reset({
        index: 0,
        routes: [{ name: "EmailVerification", params: { email: authStore.email } }],
      })
    }
  }, [authStore.isPendingVerification])

  useEffect(() => {
    if (authStore.authError) {
      Toast.show(translate(AuthErrorTxKey[authStore.authError]))
    }
  }, [authStore.authError])

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="EmailVerified" component={EmailVerifiedScreen} />
    </Stack.Navigator>
  )
})
