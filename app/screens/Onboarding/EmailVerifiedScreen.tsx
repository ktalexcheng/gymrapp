import { Button, Icon, Screen, Spacer, Text } from "app/components"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { View } from "react-native"

export const EmailVerifiedScreen = observer(() => {
  const { authenticationStore: authStore } = useStores()

  const onContinuePress = () => {
    authStore.checkEmailVerified()
  }

  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.screenContainer}>
      <View style={[styles.flex1, styles.centeredContainer]}>
        <Icon name="checkmark-circle-outline" size={80} />
        <Text tx="emailVerifiedScreen.emailVerifiedTitle" preset="heading" />
        <Spacer type="vertical" size="medium" />
        <Text tx="emailVerifiedScreen.emailVerifiedMessage" />
      </View>
      <Button tx="emailVerifiedScreen.continueButtonLabel" onPress={onContinuePress} />
    </Screen>
  )
})
