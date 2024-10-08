import { StyleSheet } from "react-native"
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
  modalContent: {
    flexBasis: "auto",
    alignContent: "center",
    padding: spacing.large,
    margin: spacing.large,
    borderRadius: 20,
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
  },
  // eslint-disable-next-line react-native/no-color-literals
  transparentBackground: {
    backgroundColor: undefined,
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
  flexGrow: {
    flexGrow: 1,
  },
  fillAndCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  justifyBetween: {
    justifyContent: "space-between",
  },
  justifyAround: {
    justifyContent: "space-around",
  },
  justifyFlexEnd: {
    justifyContent: "flex-end",
  },
  listItemContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.extraSmall,
    overflow: "hidden",
    marginBottom: spacing.small,
  },
  screenContainer: {
    flex: 1,
    padding: spacing.screenPadding,
    overflow: "hidden",
  },
  tabScreenContainer: {
    flex: 1,
    paddingTop: spacing.screenPadding,
    paddingLeft: spacing.screenPadding,
    paddingRight: spacing.screenPadding,
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.5,
  },
  invisible: {
    opacity: 0,
  },
  screenTitleMinHeight: {
    minHeight: 100,
  },
  menuPopoverContainer: {
    padding: spacing.small,
    gap: spacing.tiny,
    minWidth: 150,
    borderRadius: 10,
    // borderWidth: 1,
  },
  menuItemContainer: {
    width: "100%",
    alignItems: "flex-start",
    paddingVertical: spacing.small,
  },
  walkthroughPopoverContainer: {
    padding: spacing.medium,
    width: 300,
    borderRadius: 10,
    borderWidth: 1,
  },
})
