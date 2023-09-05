import { StyleSheet } from "react-native"
import { colors } from "./colors"
import { spacing } from "./spacing"

export const styles = StyleSheet.create({
  centeredContainer: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  flex3: {
    flex: 3,
  },
  headingContainer: {
    marginBottom: spacing.small,
  },
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
