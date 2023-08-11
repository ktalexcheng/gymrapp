import { colors, spacing } from "app/theme"
import React, { FC } from "react"
import { Animated, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Route, TabBarProps } from "react-native-tab-view"
import { RowView } from "./RowView"

export type CustomTabBarProps<T extends Route> = TabBarProps<T> & {
  tabIndex: number
  setTabIndex: (i: number) => void
}

export const TabBar: FC<CustomTabBarProps<Route>> = (props) => {
  const inputRange = props.navigationState.routes.map((_, i) => i)
  const tabIndex = props.tabIndex
  const setTabIndex = props.setTabIndex

  return (
    <RowView scrollable={true} style={$tabBarContainer}>
      {props.navigationState.routes.map((route, i) => {
        const opacity = props.position.interpolate({
          inputRange,
          outputRange: inputRange.map((inputIndex) => (inputIndex === i ? 1 : 0.5)),
        })
        const textColor = tabIndex === i ? colors.actionable : colors.textDim
        const borderColor = tabIndex === i ? colors.actionable : colors.disabled

        const $tabBarItemColor: ViewStyle = {
          borderColor,
        }

        const $tabTextColor: Animated.AnimatedProps<TextStyle> = {
          color: textColor,
          opacity,
        }

        return (
          <View key={i} style={[$tabBarItem, $tabBarItemColor]}>
            <TouchableOpacity
              onPress={() => {
                setTabIndex(i)
              }}
            >
              <Animated.Text style={[$tabText, $tabTextColor]}>{route.title}</Animated.Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </RowView>
  )
}

const $tabBarContainer: ViewStyle = {
  flex: 1,
}

const $tabBarItem: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "flex-end",
  paddingBottom: spacing.extraSmall,
  paddingHorizontal: spacing.small,
  borderBottomWidth: 3,
  height: 40,
}

const $tabText: Animated.AnimatedProps<TextStyle> = {
  fontSize: 16,
}
