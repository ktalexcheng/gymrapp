import { extendTheme } from "native-base"
import { StyleSheet } from "react-native"
import { colors } from "./colors"
import { spacing } from "./spacing"
import { fontSize, typography } from "./typography"

export const nativeBaseTheme = extendTheme({
  fonts: {
    heading: typography.primary.bold,
    body: typography.primary.normal,
  },
  fontSizes: {
    xs: fontSize.tiny,
    sm: fontSize.small,
    md: fontSize.body,
    lg: fontSize.sectionHeading,
    xl: fontSize.screenHeading,
  },
  components: {
    Select: {
      baseStyle: {
        _text: {
          fontSize: 40,
        },
      },
    },
    SelectItem: {
      baseStyle: {
        _text: {
          fontSize: 40,
        },
      },
    },
  },
})

export const styles = StyleSheet.create({
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
    padding: spacing.screenPadding,
  },
  formFieldTopMargin: {
    marginTop: spacing.large,
  },
})
