import { useStores } from "app/stores"
import React, { ErrorInfo } from "react"
import { ScrollView, TextStyle, View, ViewStyle } from "react-native"
import { Button, CustomIcon, Screen, Text } from "../../components"
import { spacing } from "../../theme"

export interface ErrorDetailsProps {
  error: Error
  errorInfo: ErrorInfo
  onReset(): void
}

export function ErrorDetails(props: ErrorDetailsProps) {
  const { themeStore } = useStores()

  const $heading: TextStyle = {
    color: themeStore.colors("error"),
    marginBottom: spacing.medium,
  }

  const $errorSection: ViewStyle = {
    flex: 2,
    backgroundColor: themeStore.colors("separator"),
    marginVertical: spacing.medium,
    borderRadius: 6,
  }

  const $errorContent: TextStyle = {
    color: themeStore.colors("error"),
  }

  const $errorBacktrace: TextStyle = {
    marginTop: spacing.medium,
    color: themeStore.colors("textDim"),
  }

  const $resetButton: ViewStyle = {
    backgroundColor: themeStore.colors("error"),
    paddingHorizontal: spacing.huge,
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$contentContainer}
    >
      <View style={$topSection}>
        <CustomIcon icon="ladybug" size={64} />
        <Text style={$heading} preset="subheading" tx="errorScreen.title" />
        <Text tx="errorScreen.friendlySubtitle" />
      </View>

      <ScrollView style={$errorSection} contentContainerStyle={$errorSectionContentContainer}>
        <Text style={$errorContent} weight="bold" text={`${props.error}`.trim()} />
        <Text
          selectable
          style={$errorBacktrace}
          text={`${props.errorInfo.componentStack}`.trim()}
        />
      </ScrollView>

      <Button
        preset="reversed"
        style={$resetButton}
        onPress={props.onReset}
        tx="errorScreen.reset"
      />
    </Screen>
  )
}

const $contentContainer: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: spacing.large,
  paddingTop: spacing.extraLarge,
  flex: 1,
}

const $topSection: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $errorSectionContentContainer: ViewStyle = {
  padding: spacing.medium,
}
