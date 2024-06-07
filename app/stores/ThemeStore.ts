import { AppColorScheme } from "app/data/constants"
import {
  Colors,
  Palette,
  styles as appStyles,
  darkColors,
  darkPalette,
  lightColors,
  lightPalette,
} from "app/theme"
import * as NavigationBar from "expo-navigation-bar"
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  setStatusBarTranslucent,
} from "expo-status-bar"
import { types } from "mobx-state-tree"
import { Platform, StyleProp } from "react-native"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const ThemeStoreModel = types
  .model("ThemeStoreModel", {
    systemColorScheme: types.optional(
      types.enumeration([AppColorScheme.Light, AppColorScheme.Dark]),
      AppColorScheme.Dark,
    ),
    appColorScheme: types.maybe(types.enumeration(Object.values(AppColorScheme))),
  })
  .views((self) => ({
    get isDark() {
      if (self.appColorScheme !== AppColorScheme.Auto)
        return self.appColorScheme === AppColorScheme.Dark

      return self.systemColorScheme === AppColorScheme.Dark
    },
  }))
  .views((self) => ({
    palette(name: keyof Palette) {
      return self.isDark ? darkPalette[name] : lightPalette[name]
    },
    colors(name: keyof Colors) {
      return self.isDark ? darkColors[name] : lightColors[name]
    },
  }))
  .views((self) => ({
    styles(name: keyof typeof appStyles): StyleProp<any> {
      // Colors are not applied to styles from app/theme/styles.ts
      // and must be dynamically applied here based on the current theme
      const coloredStyles = {
        ...appStyles,
        listItemContainer: {
          ...appStyles.listItemContainer,
          borderColor: self.colors("separator"),
        },
        modalContent: {
          ...appStyles.modalContent,
          backgroundColor: self.colors("elevatedBackground"),
          // shadowColor: self.colors("foreground"),
        },
        menuPopoverContainer: {
          ...appStyles.menuPopoverContainer,
          backgroundColor: self.colors("contentBackground"),
          borderColor: self.colors("border"),
        },
        walkthroughPopoverContainer: {
          ...appStyles.walkthroughPopoverContainer,
          backgroundColor: self.colors("contentBackground"),
          borderColor: self.colors("border"),
        },
      }

      return coloredStyles[name]
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    setAppColorScheme(colorScheme: AppColorScheme) {
      self.appColorScheme = colorScheme
      const statusBarForeground = self.isDark ? AppColorScheme.Light : AppColorScheme.Dark

      // Update the status bar and navigation bar colors
      setStatusBarStyle(statusBarForeground, true)
      if (Platform.OS === "android") {
        setStatusBarBackgroundColor(self.colors("background"), true)
        setStatusBarTranslucent(true)
        NavigationBar.setBackgroundColorAsync(self.colors("background"))
        NavigationBar.setButtonStyleAsync(statusBarForeground)
      }
    },
  }))
