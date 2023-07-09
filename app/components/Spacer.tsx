import { Spacing, spacing } from "app/theme"
import React, { FC } from "react"
import { View, ViewStyle } from "react-native"

type SpacerProps = {
  type: "horizontal" | "vertical"
  size: Spacing
}

export const Spacer: FC<SpacerProps> = ({ type: direction, size }: SpacerProps) => {
  const $spacer: ViewStyle = {
    height: direction === "vertical" ? spacing[size] : 0,
    width: direction === "horizontal" ? spacing[size] : 0,
  }

  return <View style={$spacer}></View>
}
