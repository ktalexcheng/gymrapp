import React, { FC } from "react"
import { StyleProp, View, ViewProps, ViewStyle } from "react-native"

interface RowViewProps extends React.PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>
  justifyContent?: ViewStyle["justifyContent"]
  alignItems?: ViewStyle["alignItems"]
}

export const RowView: FC<RowViewProps> = ({
  children,
  style,
  justifyContent,
  alignItems,
  ...props
}) => {
  const $rowView: ViewStyle = {
    flexDirection: "row",
  }

  if (justifyContent) {
    $rowView.justifyContent = justifyContent
  }

  if (alignItems) {
    $rowView.alignItems = alignItems
  }

  return (
    <View style={[style, $rowView]} {...props}>
      {children}
    </View>
  )
}
