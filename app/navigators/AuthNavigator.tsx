import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { AuthErrorTxKey } from "app/data/constants"
import {
  EmailVerificationScreen,
  EmailVerifiedScreen,
  SignInScreen,
  SignUpScreen,
} from "app/features/Onboarding"
import { WelcomeScreen } from "app/features/Welcome"
import { useToast } from "app/hooks"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"

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
  const { authenticationStore: authStore } = useStores()
  const [toastShowTx] = useToast()

  useEffect(() => {
    if (authStore.authError) {
      toastShowTx(AuthErrorTxKey[authStore.authError])
    }
  }, [authStore.authError])

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        headerBackButtonMenuEnabled: false,
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
