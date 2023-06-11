import React, { FC } from "react"
import { StyleProp, View, ViewProps, ViewStyle } from "react-native"

interface ColumnViewProps extends React.PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>
  justifyContent?: ViewStyle["justifyContent"]
  alignItems?: ViewStyle["alignItems"]
}

export const ColumnView: FC<ColumnViewProps> = ({
  children,
  style,
  justifyContent,
  alignItems,
  ...props
}) => {
  const $columnView: ViewStyle = {
    flexDirection: "column",
  }

  if (justifyContent) {
    $columnView.justifyContent = justifyContent
  }

  if (alignItems) {
    $columnView.alignItems = alignItems
  }

  return (
    <View style={[style, $columnView]} {...props}>
      {children}
    </View>
  )
}
