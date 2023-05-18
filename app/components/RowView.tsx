import React, { FC } from "react"
import { StyleProp, View, ViewProps, ViewStyle } from "react-native"

interface RowViewProps extends React.PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>
}

export const RowView: FC<RowViewProps> = ({ children, style, ...props }) => {
  const $rowView: ViewStyle = {
    flexDirection: "row",
  }

  return (
    <View style={[style, $rowView]} {...props}>
      {children}
    </View>
  )
}
