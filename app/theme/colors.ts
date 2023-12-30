// TODO: write documentation for colors and palette in own markdown file and add links from here

export interface Palette {
  neutral050: string
  neutral100: string
  neutral200: string
  neutral300: string
  neutral400: string
  neutral500: string
  neutral600: string
  neutral700: string
  neutral800: string
  neutral900: string

  primary050: string
  primary100: string
  primary200: string
  primary300: string
  primary400: string
  primary500: string
  primary600: string
  primary700: string
  primary800: string
  primary900: string

  secondary050: string
  secondary100: string
  secondary200: string
  secondary300: string
  secondary400: string
  secondary500: string
  secondary600: string
  secondary700: string
  secondary800: string
  secondary900: string

  angry100: string
  angry500: string

  success100: string
  success500: string

  overlay20: string
  overlay50: string
}

export interface Colors {
  /**
   * Color of the logo
   */
  logo: string
  /**
   * A helper for making something see-thru.
   */
  transparent: string
  /**
   * For blurred background.
   */
  blurBackground: string
  /**
   * The default text color in many components.
   */
  text: string
  /**
   * Secondary text information.
   */
  textDim: string
  /**
   * The default color of the screen background.
   */
  background: string
  /**
   * The default color of the background for content on a screen.
   */
  contentBackground: string
  /**
   * The default border color.
   */
  border: string
  /**
   * The main tinting color.
   */
  tint: string
  /**
   * The lighter tinting color.
   */
  lightTint: string
  /**
   * Actionable
   */
  actionable: string
  actionablePressed: string
  /**
   * A subtle color used for lines.
   */
  separator: string
  /**
   * Error messages.
   */
  error: string
  /**
   * Error background.
   */
  errorBackground: string
  /**
   * Disabled background
   */
  disabledBackground: string
  /**
   * Disabled foreground
   */
  disabledForeground: string
  /**
   * Danger
   */
  danger: string
  /**
   * Success
   */
  success: string
  /**
   * Success background.
   */
  successBackground: string
  /**
   * Contrast color with background.
   */
  foreground: string
  /**
   * Contrast color with the actionable color.
   */
  actionableForeground: string
  tintForeground: string
}

export const lightPalette: Palette = {
  neutral050: "#FAFAFA",
  neutral100: "#f5f5f5",
  neutral200: "#eeeeee",
  neutral300: "#e0e0e0",
  neutral400: "#bdbdbd",
  neutral500: "#9e9e9e",
  neutral600: "#757575",
  neutral700: "#616161",
  neutral800: "#424242",
  neutral900: "#212121",

  primary050: "#F2FFD1",
  primary100: "#E6FFA3",
  primary200: "#D9FF75",
  primary300: "#CDFF47",
  primary400: "#C1FF19",
  primary500: "#CFFF03",
  primary600: "#B8E603",
  primary700: "#A1CC03",
  primary800: "#8AB303",
  primary900: "#739A03",

  secondary050: "#E0F2F2",
  secondary100: "#B2E0E0",
  secondary200: "#85CDCD",
  secondary300: "#57BABA",
  secondary400: "#2AA7A7",
  secondary500: "#1F5F5B",
  secondary600: "#1F5552",
  secondary700: "#1F4B49",
  secondary800: "#1F4140",
  secondary900: "#1F3737",

  angry100: "#F2D6CD",
  angry500: "#C03403",

  success100: "#D9EAD3",
  success500: "#2E7D32",

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const lightColors: Colors = {
  logo: lightPalette.secondary500,
  transparent: "rgba(0, 0, 0, 0)",
  blurBackground: lightPalette.neutral050 + "BB",
  text: lightPalette.neutral900,
  textDim: lightPalette.neutral400,
  background: lightPalette.neutral050,
  contentBackground: lightPalette.neutral200,
  border: lightPalette.neutral400,
  tint: lightPalette.secondary500,
  lightTint: lightPalette.primary300,
  actionable: lightPalette.secondary500,
  actionablePressed: lightPalette.secondary400,
  separator: lightPalette.neutral400,
  error: lightPalette.angry500,
  errorBackground: lightPalette.angry100,
  disabledBackground: lightPalette.neutral300,
  disabledForeground: lightPalette.neutral600,
  danger: lightPalette.angry500,
  success: lightPalette.success500,
  successBackground: lightPalette.success500,
  foreground: lightPalette.neutral900,
  actionableForeground: lightPalette.neutral050,
  tintForeground: lightPalette.neutral050,
}

export const darkPalette: Palette = {
  neutral050: "#212121",
  neutral100: "#424242",
  neutral200: "#616161",
  neutral300: "#757575",
  neutral400: "#9e9e9e",
  neutral500: "#bdbdbd",
  neutral600: "#e0e0e0",
  neutral700: "#eeeeee",
  neutral800: "#f5f5f5",
  neutral900: "#FAFAFA",

  primary050: "#739A03",
  primary100: "#8AB303",
  primary200: "#A1CC03",
  primary300: "#B8E603",
  primary400: "#CFFF03",
  primary500: "#C1FF19",
  primary600: "#CDFF47",
  primary700: "#D9FF75",
  primary800: "#E6FFA3",
  primary900: "#F2FFD1",

  secondary050: "#1F3737",
  secondary100: "#1F4140",
  secondary200: "#1F4B49",
  secondary300: "#1F5552",
  secondary400: "#1F5F5B",
  secondary500: "#2AA7A7",
  secondary600: "#57BABA",
  secondary700: "#85CDCD",
  secondary800: "#B2E0E0",
  secondary900: "#E0F2F2",

  angry100: "#C03403",
  angry500: "#F2D6CD",

  success100: "#2E7D32",
  success500: "#D9EAD3",

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const darkColors: Colors = {
  logo: darkPalette.primary500,
  transparent: "rgba(0, 0, 0, 0)",
  blurBackground: darkPalette.neutral050 + "BB",
  text: darkPalette.neutral900,
  textDim: darkPalette.neutral200,
  background: darkPalette.neutral050,
  contentBackground: darkPalette.neutral100,
  border: darkPalette.neutral200,
  tint: darkPalette.primary500,
  lightTint: darkPalette.primary100,
  actionable: darkPalette.primary500,
  actionablePressed: darkPalette.primary400,
  separator: darkPalette.neutral400,
  error: darkPalette.angry100,
  errorBackground: darkPalette.angry500,
  disabledBackground: darkPalette.neutral300,
  disabledForeground: darkPalette.neutral600,
  danger: darkPalette.angry100,
  success: darkPalette.success100,
  successBackground: darkPalette.success500,
  foreground: darkPalette.neutral900,
  actionableForeground: darkPalette.neutral050,
  tintForeground: darkPalette.neutral050,
}
