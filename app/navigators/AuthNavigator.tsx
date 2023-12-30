import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { SignInScreen, SignUpScreen, WelcomeScreen } from "app/screens"
import React from "react"

export type AuthStackParamList = {
  Welcome: undefined
  SignIn: undefined
  SignUp: undefined
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator = () => {
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
    </Stack.Navigator>
  )
}
