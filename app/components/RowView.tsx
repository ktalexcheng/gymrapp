import React, { FC } from "react"
import { ScrollView, StyleProp, View, ViewProps, ViewStyle } from "react-native"

interface RowViewProps extends React.PropsWithChildren<ViewProps> {
  style?: StyleProp<ViewStyle>
  justifyContent?: ViewStyle["justifyContent"]
  alignItems?: ViewStyle["alignItems"]
  scrollable?: boolean
}

export const RowView: FC<RowViewProps> = ({
  children,
  style,
  justifyContent,
  alignItems,
  scrollable = false,
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

  return scrollable ? (
    // ScrollView height cannot be set directly, must wrap with a View
    <View>
      <ScrollView horizontal={true}>
        <View style={[style, $rowView]} {...props}>
          {children}
        </View>
      </ScrollView>
    </View>
  ) : (
    <View style={[style, $rowView]} {...props}>
      {children}
    </View>
  )
}
