import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { ComponentType } from "react"
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { spacing, typography } from "../theme"
import { Text, TextProps } from "./Text"

type Presets = "default" | "filled" | "reversed" | "text" | "menuItem"

export interface ButtonAccessoryProps {
  style: StyleProp<any>
  pressableState: PressableStateCallbackType
}

export interface ButtonProps extends PressableProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TextProps["tx"]
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: TextProps["text"]
  /**
   * Numbers of button text lines to display and cutoff with ellipsis.
   */
  numberOfLines?: TextProps["numberOfLines"]
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: TextProps["txOptions"]
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
  /**
   * An optional style override for the "pressed" state.
   */
  pressedStyle?: StyleProp<ViewStyle>
  /**
   * An optional style override for the button text.
   */
  textStyle?: StyleProp<TextStyle>
  /**
   * An optional style override for the button text when in the "pressed" state.
   */
  pressedTextStyle?: StyleProp<TextStyle>
  /**
   * One of the different types of button presets.
   */
  preset?: Presets
  /**
   * An optional component to render on the right side of the text.
   * Example: `RightAccessory={(props) => <View {...props} />}`
   */
  RightAccessory?: ComponentType<ButtonAccessoryProps>
  /**
   * An optional component to render on the left side of the text.
   * Example: `LeftAccessory={(props) => <View {...props} />}`
   */
  LeftAccessory?: ComponentType<ButtonAccessoryProps>
  /**
   * Children components.
   */
  children?: React.ReactNode
}

/**
 * A component that allows users to take actions and make choices.
 * Wraps the Text component with a Pressable component.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Components-Button.md)
 */
export const Button = observer((props: ButtonProps) => {
  const {
    tx,
    text,
    numberOfLines,
    txOptions,
    style: $viewStyleOverride,
    pressedStyle: $pressedViewStyleOverride,
    textStyle: $textStyleOverride,
    pressedTextStyle: $pressedTextStyleOverride,
    children,
    RightAccessory,
    LeftAccessory,
    ...rest
  } = props

  const { themeStore } = useStores()

  const $viewPresets = {
    default: [
      $baseViewStyle,
      {
        borderWidth: 1,
        borderColor: themeStore.palette("neutral400"),
        backgroundColor: themeStore.palette("neutral100"),
      },
    ] as StyleProp<ViewStyle>,

    filled: [
      $baseViewStyle,
      { backgroundColor: themeStore.palette("neutral300") },
    ] as StyleProp<ViewStyle>,

    reversed: [
      $baseViewStyle,
      { backgroundColor: themeStore.palette("neutral800") },
    ] as StyleProp<ViewStyle>,

    text: [$baseViewStyle, { backgroundColor: null }] as StyleProp<ViewStyle>,

    menuItem: [
      $baseViewStyle,
      { backgroundColor: null, justifyContent: "flex-start" },
    ] as StyleProp<ViewStyle>,
  }

  const $textPresets: Record<Presets, StyleProp<TextStyle>> = {
    default: $baseTextStyle,
    filled: $baseTextStyle,
    reversed: [$baseTextStyle, { color: themeStore.palette("neutral100") }],
    text: [$baseTextStyle, { color: themeStore.colors("actionable") }],
    menuItem: [$baseTextStyle, { color: themeStore.colors("text"), textAlign: "left" }],
  }

  const $pressedViewPresets: Record<Presets, StyleProp<ViewStyle>> = {
    default: { backgroundColor: themeStore.palette("neutral200") },
    filled: { backgroundColor: themeStore.palette("neutral400") },
    reversed: { backgroundColor: themeStore.palette("neutral700") },
    text: {},
    menuItem: {},
  }

  const $pressedTextPresets: Record<Presets, StyleProp<TextStyle>> = {
    default: { opacity: 0.9 },
    filled: { opacity: 0.9 },
    reversed: { opacity: 0.9 },
    text: { color: themeStore.colors("actionablePressed"), opacity: 0.9 },
    menuItem: { color: themeStore.colors("textDim"), opacity: 0.9 },
  }

  const preset: Presets = props.preset && $viewPresets[props.preset] ? props.preset : "default"
  function $viewStyle({ pressed }) {
    return [
      $viewPresets[preset],
      $viewStyleOverride,
      !!pressed && [$pressedViewPresets[preset], $pressedViewStyleOverride],
    ]
  }
  function $textStyle({ pressed }) {
    return [
      $textPresets[preset],
      props.disabled && { color: themeStore.colors("disabledBackground") },
      $textStyleOverride,
      !!pressed && [$pressedTextPresets[preset], $pressedTextStyleOverride],
    ]
  }

  return (
    <View>
      <Pressable style={$viewStyle} accessibilityRole="button" {...rest}>
        {(state) => (
          <>
            {!!LeftAccessory && (
              <LeftAccessory style={$leftAccessoryStyle} pressableState={state} />
            )}

            <Text
              tx={tx}
              text={text}
              numberOfLines={numberOfLines}
              txOptions={txOptions}
              style={$textStyle(state)}
            >
              {children}
            </Text>

            {!!RightAccessory && (
              <RightAccessory style={$rightAccessoryStyle} pressableState={state} />
            )}
          </>
        )}
      </Pressable>
    </View>
  )
})

const $baseViewStyle: ViewStyle = {
  minHeight: 44,
  borderRadius: 24,
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "row",
  padding: spacing.tiny,
  marginVertical: spacing.tiny,
  overflow: "hidden",
}

const $baseTextStyle: TextStyle = {
  fontSize: 16,
  lineHeight: 20,
  fontFamily: typography.primary.medium,
  textAlign: "center",
  flexShrink: 1,
  flexGrow: 0,
  zIndex: 2,
}

const $rightAccessoryStyle: ViewStyle = { marginStart: spacing.extraSmall, zIndex: 1 }
const $leftAccessoryStyle: ViewStyle = { marginEnd: spacing.extraSmall, zIndex: 1 }
