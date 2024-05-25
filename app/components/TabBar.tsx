import { useStores } from "app/stores"
import { spacing, typography } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { Animated, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { TabBar as RNTabBar, TabBarProps as RNTabBarProps, Route } from "react-native-tab-view"
import { RowView } from "./RowView"

export type CustomTabBarProps<T extends Route> = RNTabBarProps<T> & {
  tabIndex: number
  setTabIndex: (i: number) => void
}

// CustomTabBar is not used -- I'm not sure why I implemented this initially instead of
// customizing the TabBar component from react-native-tab-view
export const CustomTabBar: FC<CustomTabBarProps<Route>> = observer((props) => {
  const { themeStore } = useStores()
  const inputRange = props.navigationState.routes.map((_, i) => i)
  const tabIndex = props.tabIndex
  const setTabIndex = props.setTabIndex

  return (
    <RowView scrollable={props.scrollEnabled} style={$tabBarContainer}>
      {props.navigationState.routes.map((route, i) => {
        const opacity = props.position.interpolate({
          inputRange,
          outputRange: inputRange.map((inputIndex) => (inputIndex === i ? 1 : 0.5)),
        })
        const textColor = tabIndex === i ? themeStore.colors("text") : themeStore.colors("textDim")
        const borderColor =
          tabIndex === i ? themeStore.colors("text") : themeStore.colors("disabledBackground")

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
              <Animated.Text style={[$tabLabel, $tabTextColor]}>{route.title}</Animated.Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </RowView>
  )
})

export type TabBarProps<T extends Route> = RNTabBarProps<T> & {
  dynamicTabWidth?: boolean
}

export const TabBar = observer((props: TabBarProps<Route>) => {
  const { themeStore } = useStores()

  const $tabContainer: ViewStyle = {
    backgroundColor: themeStore.colors("background"),
    marginBottom: spacing.small,
  }

  const $tabItem: ViewStyle = {
    ...$tabItemBase,
    width: props.dynamicTabWidth ? "auto" : undefined,
  }

  return (
    <RNTabBar
      style={$tabContainer}
      tabStyle={$tabItem}
      indicatorStyle={{ backgroundColor: themeStore.colors("text") }}
      labelStyle={$tabLabel}
      {...props}
    />
  )
})

const $tabBarContainer: ViewStyle = {
  flex: 1,
  marginBottom: spacing.tiny,
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

const $tabItemBase: ViewStyle = {
  minHeight: 0,
  paddingVertical: spacing.extraSmall,
  paddingHorizontal: spacing.medium,
}

const $tabLabel: TextStyle = {
  fontFamily: typography.primary.normal,
  textTransform: "none",
  fontSize: 16,
  lineHeight: 24,
}
