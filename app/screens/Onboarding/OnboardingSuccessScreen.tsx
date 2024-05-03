import { Screen, Spacer, Text } from "app/components"
import { useMainNavigation } from "app/navigators/navigationUtilities"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useEffect } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

export const OnboardingSuccessScreen = observer(() => {
  const { themeStore } = useStores()
  const mainNavigation = useMainNavigation()

  const resetToHomeTabNavigator = () => {
    mainNavigation.reset({
      index: 0,
      routes: [{ name: "HomeTabNavigator" }],
    })
  }

  useEffect(() => {
    const navigateTimeout = setTimeout(() => {
      // Navigate to HomeTabNavigator and make sure onboarding is no longer in the stack
      resetToHomeTabNavigator()
    }, 5000)

    return () => clearTimeout(navigateTimeout)
  }, [])

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <TouchableOpacity onPress={resetToHomeTabNavigator}>
        <View style={$contentContainer}>
          <Text
            tx="onboardingSuccessScreen.onboardingSuccessTitle"
            preset="screenTitle"
            textColor={themeStore.colors("logo")}
          />
          <Spacer type="vertical" size="large" />
          <Text tx="onboardingSuccessScreen.onboardingSuccessMessage" />
        </View>
      </TouchableOpacity>
    </Screen>
  )
})

const $contentContainer: ViewStyle = {
  height: "100%",
  width: "100%",
  justifyContent: "center",
}
