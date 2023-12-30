import { useStores } from "app/stores"
import { fontSize, spacing } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { TxKeyPath, translate } from "../i18n"
import { Text } from "./Text"

export interface DividerProps {
  orientation: "horizontal" | "vertical"
  tx?: TxKeyPath
  text?: string
  fontSize?: number
  lineWidth?: number
  spaceSize?: number
  color?: string
}

export const Divider = observer((props: DividerProps) => {
  const { themeStore } = useStores()

  const {
    orientation,
    tx,
    text,
    fontSize: fontSizeOverride,
    lineWidth = 1,
    spaceSize = spacing.medium,
    color = themeStore.colors("separator"),
  } = props

  const $containerStyle: ViewStyle = {
    flexDirection: orientation === "horizontal" ? "row" : "column",
    alignItems: "center",
  }

  const $dividerLineStyle: ViewStyle = {
    flex: 1,
    borderColor: color,
  }

  switch (orientation) {
    case "horizontal":
      $containerStyle.marginVertical = spaceSize
      $dividerLineStyle.borderBottomWidth = lineWidth
      break
    case "vertical":
      $containerStyle.marginHorizontal = spaceSize
      $dividerLineStyle.borderRightWidth = lineWidth
      break
  }

  const $textStyle: TextStyle = {
    paddingHorizontal: spacing.extraSmall,
    fontSize: fontSizeOverride || fontSize.body,
    color: themeStore.colors("separator"),
  }

  const i18nText = tx && translate(tx)
  const separatorText = i18nText || text

  return (
    <View style={$containerStyle}>
      <View style={$dividerLineStyle} />
      {separatorText ? (
        <Text style={$textStyle}>{separatorText}</Text>
      ) : (
        <View style={$dividerLineStyle} />
      )}
      <View style={$dividerLineStyle} />
    </View>
  )
})
