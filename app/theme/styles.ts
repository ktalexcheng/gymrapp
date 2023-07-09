import { StyleSheet } from "react-native"
import { colors } from "./colors"
import { spacing } from "./spacing"

export const styles = StyleSheet.create({
  listItem: {
    borderColor: colors.separator,
    borderWidth: 1,
  },
  screenContainer: {
    padding: spacing.screenPadding,
  },
})
