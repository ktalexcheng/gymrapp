import { StyleSheet } from "react-native"
import { colors } from "./colors"
import { spacing } from "./spacing"

export const styles = StyleSheet.create({
  listItem: {
    borderColor: colors.separator,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.extraSmall,
  },
  screenContainer: {
    padding: spacing.screenPadding,
  },
})
