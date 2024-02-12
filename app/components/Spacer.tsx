import { Spacing, spacing } from "app/theme"
import React, { FC } from "react"
import { View, ViewProps } from "react-native"

interface SpacerProps extends React.PropsWithChildren<ViewProps> {
  type: "horizontal" | "vertical"
  size: Spacing
}

export const Spacer: FC<SpacerProps> = (props: SpacerProps) => {
  const { type, size, style: styleOverride } = props

  const spacingSize = spacing[size] ?? spacing.medium
  const $spacer = [
    {
      height: type === "vertical" ? spacingSize : 0,
      width: type === "horizontal" ? spacingSize : 0,
    },
    styleOverride,
  ]

  return <View style={$spacer} />
}
