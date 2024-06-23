import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { Button, ButtonProps } from "./Button"

interface ToggleButtonProps extends ButtonProps {
  selected?: boolean
}

const ToggleButton = observer((props: ToggleButtonProps) => {
  const { themeStore } = useStores()

  const $buttonView: ViewStyle = {
    minHeight: 0,
    borderRadius: 40,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.tiny,
    backgroundColor: props.selected
      ? themeStore.colors("actionable")
      : themeStore.colors("disabledBackground"),
  }

  const $text: TextStyle = {
    color: props.selected ? themeStore.colors("actionableForeground") : themeStore.colors("text"),
  }

  return <Button {...props} style={$buttonView} textStyle={$text} preset="filled" />
})

type ButtonGroupProps = {
  buttons: {
    tx: TxKeyPath
    state: "active" | "inactive"
    onPress: () => void
  }[]
}

export const ButtonGroup = (props: ButtonGroupProps) => {
  const { buttons } = props

  return (
    <View style={$buttonGroup}>
      {buttons.map((button, index) => (
        <ToggleButton
          key={index}
          tx={button.tx}
          selected={button.state === "active"}
          onPress={button.onPress}
        />
      ))}
    </View>
  )
}

const $buttonGroup: ViewStyle = {
  flexDirection: "row",
  gap: spacing.small,
}
