// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import {
  LexendExa_700Bold as lexendExaBold,
  LexendExa_300Light as lexendExaLight,
  LexendExa_500Medium as lexendExaMedium,
  LexendExa_400Regular as lexendExaRegular,
  LexendExa_600SemiBold as lexendExaSemiBold,
} from "@expo-google-fonts/lexend-exa"
import {
  SpaceGrotesk_700Bold as spaceGroteskBold,
  SpaceGrotesk_300Light as spaceGroteskLight,
  SpaceGrotesk_500Medium as spaceGroteskMedium,
  SpaceGrotesk_400Regular as spaceGroteskRegular,
  SpaceGrotesk_600SemiBold as spaceGroteskSemiBold,
} from "@expo-google-fonts/space-grotesk"
import { Platform } from "react-native"

export const customFontsToLoad = {
  spaceGroteskLight,
  spaceGroteskRegular,
  spaceGroteskMedium,
  spaceGroteskSemiBold,
  spaceGroteskBold,
  lexendExaLight,
  lexendExaRegular,
  lexendExaMedium,
  lexendExaSemiBold,
  lexendExaBold,
}

const fonts = {
  spaceGrotesk: {
    // Cross-platform Google font.
    light: "spaceGroteskLight",
    normal: "spaceGroteskRegular",
    medium: "spaceGroteskMedium",
    semiBold: "spaceGroteskSemiBold",
    bold: "spaceGroteskBold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
  lexandExa: {
    light: "lexendExaLight",
    normal: "lexendExaRegular",
    medium: "lexendExaMedium",
    semiBold: "lexendExaSemiBold",
    bold: "lexendExaBold",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.spaceGrotesk,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: fonts.lexandExa,
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}

export const fontSize = {
  screenHeading: 32,
  sectionHeading: 28,
  body: 16,
  small: 14,
  tiny: 10,
}
