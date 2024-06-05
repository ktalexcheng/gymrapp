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
import { LoadingIndicator } from "./LoadingIndicator"
import { Text, TextProps } from "./Text"

type Presets =
  | "default"
  | "filled"
  | "reversed"
  | "text"
  | "menuItem"
  | "dangerOutline"
  | "dangerText" // TODO: default, filled, reversed don't have clear distinction

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
  /**
   * Indicate if the process is ongoing and disable the button.
   */
  isBusy?: boolean
}

/**
 * A component that allows users to take actions and make choices.
 * Wraps the Text component with a Pressable component.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Components-Button.md)
 */
export const Button = observer(
  React.forwardRef(function Button(props: ButtonProps, forwardedRef: React.Ref<any>) {
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
      isBusy,
      ...rest
    } = props

    const { themeStore } = useStores()

    const $viewPresets: Record<Presets, StyleProp<ViewStyle>> = {
      default: [
        $baseViewStyle,
        {
          // borderWidth: 1,
          // borderColor: themeStore.palette("neutral400"),
          backgroundColor: themeStore.palette("neutral200"),
        },
      ] as StyleProp<ViewStyle>,

      filled: [
        $baseViewStyle,
        { backgroundColor: themeStore.palette("neutral400") },
      ] as StyleProp<ViewStyle>,

      reversed: [
        $baseViewStyle,
        { backgroundColor: themeStore.palette("neutral800") },
      ] as StyleProp<ViewStyle>,

      text: [
        $baseViewStyle,
        {
          backgroundColor: null,
          paddingHorizontal: null,
          paddingVertical: null,
          minHeight: 44,
        },
      ] as StyleProp<ViewStyle>,

      menuItem: [
        $baseViewStyle,
        {
          backgroundColor: null,
          justifyContent: "flex-start",
        },
      ] as StyleProp<ViewStyle>,

      // outline: [
      //   $baseViewStyle,
      //   { borderWidth: 1, borderColor: themeStore.colors("actionable") },
      // ] as StyleProp<ViewStyle>,

      dangerOutline: [
        $baseViewStyle,
        { borderWidth: 1, borderColor: themeStore.colors("danger") },
      ] as StyleProp<ViewStyle>,

      dangerText: [$baseViewStyle, { backgroundColor: null }] as StyleProp<ViewStyle>,
    }

    const $textPresets: Record<Presets, StyleProp<TextStyle>> = {
      default: $baseTextStyle,
      filled: $baseTextStyle,
      reversed: [$baseTextStyle, { color: themeStore.palette("neutral100") }],
      text: [$baseTextStyle, { color: themeStore.colors("actionable") }],
      menuItem: [$baseTextStyle, { color: themeStore.colors("text"), textAlign: "left" }],
      // outline: [$baseTextStyle, { color: themeStore.colors("actionable") }],
      dangerOutline: [$baseTextStyle, { color: themeStore.colors("danger") }],
      dangerText: [$baseTextStyle, { color: themeStore.colors("danger") }],
    }

    const $pressedViewPresets: Record<Presets, ViewStyle> = {
      default: { backgroundColor: themeStore.palette("neutral200") },
      filled: { backgroundColor: themeStore.palette("neutral400") },
      reversed: { backgroundColor: themeStore.palette("neutral700") },
      text: {},
      menuItem: {},
      // outline: {},
      dangerOutline: {},
      dangerText: {},
    }

    const $pressedTextPresets: Record<Presets, StyleProp<TextStyle>> = {
      default: { opacity: 0.9 },
      filled: { opacity: 0.9 },
      reversed: { opacity: 0.9 },
      text: { color: themeStore.colors("actionablePressed"), opacity: 0.8 },
      menuItem: { color: themeStore.colors("textDim"), opacity: 0.8 },
      // outline: { color: themeStore.colors("actionablePressed"), opacity: 0.8 },
      dangerOutline: { color: themeStore.colors("danger"), opacity: 0.8 },
      dangerText: { color: themeStore.colors("danger"), opacity: 0.8 },
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
    // Show an opaque overlay of the pressed state when the button is busy
    const $isBusyOverlay: StyleProp<ViewStyle> = [
      $viewPresets[preset],
      $viewStyleOverride,
      $pressedViewPresets[preset],
      $pressedViewStyleOverride,
      {
        position: "absolute",
        opacity: 0.8,
        zIndex: 100,
      },
    ]

    return (
      <Pressable
        ref={forwardedRef}
        disabled={isBusy}
        style={$viewStyle}
        accessibilityRole="button"
        {...rest}
      >
        {(state) => (
          <>
            {isBusy && (
              <View style={$isBusyOverlay}>
                <LoadingIndicator />
              </View>
            )}

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
    )
  }),
)

const $baseViewStyle: ViewStyle = {
  // minHeight: 44,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "row",
  paddingVertical: spacing.extraSmall,
  paddingHorizontal: spacing.medium,
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
