import { useStores } from "app/stores"
import i18n from "i18n-js"
import { observer } from "mobx-react-lite"
import React from "react"
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native"
import { TxKeyPath, translate } from "../i18n"
import { typography } from "../theme"

type Sizes = keyof typeof $sizeStyles
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
  size?: Sizes
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

  const i18nText = tx && translate(tx, txOptions)
  const content = i18nText || text || children

  const $baseStyle: StyleProp<TextStyle> = [
    $sizeStyles.sm,
    $primaryWeightStyles.normal,
    { color: themeStore.colors("text") },
  ]

  const $presets = {
    default: $baseStyle,

    bold: [$baseStyle, $primaryWeightStyles.bold] as StyleProp<TextStyle>,

    light: [$baseStyle, $primaryWeightStyles.light] as StyleProp<TextStyle>,

    screenTitle: [$baseStyle, $sizeStyles.xxl, $secondaryWeightStyles.bold] as StyleProp<TextStyle>,

    heading: [$baseStyle, $sizeStyles.xl, $secondaryWeightStyles.medium] as StyleProp<TextStyle>,

    subheading: [$baseStyle, $sizeStyles.lg, $secondaryWeightStyles.medium] as StyleProp<TextStyle>,

    formLabel: [$baseStyle, $primaryWeightStyles.medium] as StyleProp<TextStyle>,

    formHelper: [$baseStyle, $sizeStyles.sm, $primaryWeightStyles.normal] as StyleProp<TextStyle>,

    danger: [
      $baseStyle,
      $primaryWeightStyles.bold,
      { color: themeStore.colors("danger") },
    ] as StyleProp<TextStyle>,
  }

  const preset: Presets = props.preset && $presets[props.preset] ? props.preset : "default"
  const $styles = [
    !!preset && $presets[preset],
    !!weight && $primaryWeightStyles[weight],
    !!size && $sizeStyles[size],
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

const $sizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } as TextStyle,
  xl: { fontSize: 28, lineHeight: 38 } as TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } as TextStyle,
  md: { fontSize: 18, lineHeight: 26 } as TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } as TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } as TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } as TextStyle,
}

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
