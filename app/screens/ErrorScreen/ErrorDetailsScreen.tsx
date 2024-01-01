import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { ErrorInfo } from "react"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { Button, CustomIcon, Screen, Text } from "../../components"
import { spacing, styles } from "../../theme"

export interface ErrorDetailsProps {
  error: Error
  errorInfo: ErrorInfo
  onReset(): void
}

export const ErrorDetailsScreen = observer((props: ErrorDetailsProps) => {
  const { themeStore } = useStores()

  const $errorSection: ViewStyle = {
    flex: 1,
    backgroundColor: themeStore.colors("contentBackground"),
    marginVertical: spacing.medium,
    borderRadius: 6,
  }

  const $resetButton: ViewStyle = {
    backgroundColor: themeStore.colors("error"),
  }

  const $resetButtonText: TextStyle = {
    color: themeStore.colors("actionableForeground"),
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={styles.screenContainer}
    >
      <View style={styles.alignCenter}>
        <CustomIcon icon="ladybug" size={64} />
        <Text preset="subheading" tx="errorScreen.title" textColor={themeStore.colors("error")} />
        <Text tx="errorScreen.message" />
      </View>

      <ScrollView style={$errorSection} contentContainerStyle={styles.screenContainer}>
        <Text textColor={themeStore.colors("error")} weight="bold" text={`${props.error}`.trim()} />
        <Text
          selectable
          textColor={themeStore.colors("textDim")}
          text={`${props.errorInfo.componentStack}`.trim()}
        />
      </ScrollView>

      <Button
        preset="reversed"
        style={$resetButton}
        textStyle={$resetButtonText}
        onPress={props.onReset}
        tx="errorScreen.reset"
      />
    </Screen>
  )
})
