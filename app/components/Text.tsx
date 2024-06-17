import { useLocale } from "app/context"
import { AppLocale } from "app/data/constants"
import { useStores } from "app/stores"
import i18n from "i18n-js"
import { observer } from "mobx-react-lite"
import React from "react"
import {
  Platform,
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from "react-native"
import { TxKeyPath, translate } from "../i18n"
import { $fontSizeStyles, FontSize, typography } from "../theme"

type Weights = keyof typeof typography.primary
type Presets =
  | "default"
  | "bold"
  | "light"
  | "screenTitle"
  | "heading"
  | "subheading"
  | "formLabel"
  | "formHelper"
  | "danger"

export interface TextProps extends RNTextProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TxKeyPath
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: i18n.TranslateOptions
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * Convenient prop for setting text alignment.
   */
  textAlign?: TextStyle["textAlign"]
  /**
   * Color of the text
   */
  textColor?: string
  /**
   * One of the different types of text presets.
   */
  preset?: Presets
  /**
   * Text weight modifier.
   */
  weight?: Weights
  /**
   * Text size modifier.
   */
  size?: FontSize
  /**
   * Children components.
   */
  children?: React.ReactNode
  /**
   * Visibility of the text.
   */
  visible?: boolean
}

/**
 * For your text displaying needs.
 * This component is a HOC over the built-in React Native one.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Components-Text.md)
 */
export const Text = observer((props: TextProps) => {
  const {
    weight,
    size,
    tx,
    txOptions,
    text,
    children,
    style: $styleOverride,
    textAlign: $textAlignOverride,
    textColor: textColorOverride,
    visible = true,
    ...rest
  } = props

  const { themeStore } = useStores()
  const { locale } = useLocale()

  const i18nText = tx && translate(tx, txOptions)
  const content = i18nText ?? text ?? children

  const $baseStyle: StyleProp<TextStyle> = [
    $fontSizeStyles.sm,
    $primaryWeightStyles.normal,
    { color: themeStore.colors("text") },
  ]

  const $presets = {
    default: $baseStyle,

    bold: [$baseStyle, $primaryWeightStyles.bold] as StyleProp<TextStyle>,

    light: [$baseStyle, $primaryWeightStyles.light] as StyleProp<TextStyle>,

    screenTitle: [
      $baseStyle,
      $fontSizeStyles.xxl,
      $secondaryWeightStyles.bold,
    ] as StyleProp<TextStyle>,

    heading: [
      $baseStyle,
      $fontSizeStyles.xl,
      $secondaryWeightStyles.medium,
    ] as StyleProp<TextStyle>,

    subheading: [
      $baseStyle,
      $fontSizeStyles.lg,
      $secondaryWeightStyles.medium,
    ] as StyleProp<TextStyle>,

    formLabel: [$baseStyle, $primaryWeightStyles.medium] as StyleProp<TextStyle>,

    formHelper: [
      $baseStyle,
      $fontSizeStyles.sm,
      $primaryWeightStyles.light,
    ] as StyleProp<TextStyle>,

    danger: [
      $baseStyle,
      $primaryWeightStyles.bold,
      { color: themeStore.colors("danger") },
    ] as StyleProp<TextStyle>,
  }

  switch (locale) {
    case AppLocale.zh_TW:
      // On Android, Chinese with medium weight looks the same as regular, so we use bold instead
      if (Platform.OS === "android") {
        $presets.heading = [$presets.heading, $secondaryWeightStyles.bold]
        $presets.subheading = [$presets.subheading, $secondaryWeightStyles.bold]
        $presets.formLabel = [$presets.formLabel, $primaryWeightStyles.bold]
      }

      break
  }

  const preset: Presets = props.preset && $presets[props.preset] ? props.preset : "default"
  const $styles = [
    !!preset && $presets[preset],
    !!weight && $primaryWeightStyles[weight],
    !!size && $fontSizeStyles[size],
    $styleOverride,
    !!textColorOverride && {
      color: textColorOverride,
    },
    $textAlignOverride && { textAlign: $textAlignOverride },
    !visible && { opacity: 0 },
  ]

  return (
    <RNText {...rest} style={$styles}>
      {content}
    </RNText>
  )
})

const $primaryWeightStyles = Object.entries(typography.primary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } }
  },
  {},
) as Record<Weights, TextStyle>

const $secondaryWeightStyles = Object.entries(typography.secondary).reduce(
  (acc, [weight, fontFamily]) => {
    return { ...acc, [weight]: { fontFamily } }
  },
  {},
) as Record<Weights, TextStyle>
