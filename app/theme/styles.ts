import { StyleSheet } from "react-native"
import { colors } from "./colors"
import { spacing } from "./spacing"

export const styles = StyleSheet.create({
  fullHeight: {
    height: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  centeredContainer: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  // eslint-disable-next-line react-native/no-color-literals
  transparentBackground: {
    backgroundColor: null,
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
  flex4: {
    flex: 4,
  },
  flex5: {
    flex: 5,
  },
  alignCenter: {
    alignItems: "center",
  },
  textAlignCenter: {
    textAlign: "center",
  },
  justifyCenter: {
    justifyContent: "center",
  },
  listItemContainer: {
    borderColor: colors.separator,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.extraSmall,
  },
  screenContainer: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  formFieldTopMargin: {
    marginTop: spacing.large,
  },
  disabled: {
    opacity: 0.5,
  },
})
