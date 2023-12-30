import {
  Colors,
  Palette,
  styles as appStyles,
  darkColors,
  darkPalette,
  lightColors,
  lightPalette,
} from "app/theme"
import { types } from "mobx-state-tree"
import { StyleProp } from "react-native"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const ThemeStoreModel = types
  .model("ThemeStoreModel", {
    systemColorScheme: types.optional(types.enumeration(["light", "dark"]), "dark"),
    appColorScheme: types.maybe(types.enumeration(["light", "dark", "auto"])),
  })
  .views((self) => ({
    get isDark() {
      if (self.appColorScheme !== "auto") return self.appColorScheme === "dark"

      return self.systemColorScheme === "dark"
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
          backgroundColor: self.colors("contentBackground"),
          shadowColor: self.colors("foreground"),
        },
        menuPopoverContainer: {
          ...appStyles.menuPopoverContainer,
          backgroundColor: self.colors("contentBackground"),
          borderColor: self.colors("border"),
        },
      }

      return coloredStyles[name]
    },
  }))
  .actions(withSetPropAction)
