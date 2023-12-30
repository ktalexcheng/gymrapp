import { Button, Screen, Spacer, Text } from "app/components"
import { useAuthNavigation } from "app/navigators/navigationUtilities"
import { spacing, styles } from "app/theme"
import React from "react"
import { View, ViewStyle } from "react-native"

export const WelcomeScreen = () => {
  const authNavigation = useAuthNavigation()

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={[styles.flex1, styles.alignCenter, styles.justifyCenter]}>
        <Text tx="common.appTitle" preset="screenTitle" />
      </View>
      <View style={$bottomContainer}>
        <Text tx="welcomeScreen.welcomeTitle" preset="subheading" />
        <Text tx="welcomeScreen.welcomeMessage" preset="default" />
        <Spacer type="vertical" size="massive" />
        <Button
          tx="welcomeScreen.signInButtonLabel"
          preset="default"
          style={$button}
          onPress={() => authNavigation.navigate("SignIn")}
        />
        <Spacer type="vertical" size="medium" />
        <Button
          tx="welcomeScreen.signUpButtonLabel"
          preset="text"
          style={$button}
          onPress={() => authNavigation.navigate("SignUp")}
        />
        <Spacer type="vertical" size="large" />
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: spacing.screenPadding,
}

const $bottomContainer: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
  padding: spacing.medium,
}

const $button: ViewStyle = {
  width: "100%",
}
