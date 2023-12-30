import Ionicons from "@expo/vector-icons/Ionicons"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import * as React from "react"
import { ComponentType } from "react"
import {
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native"

export type IconTypes = keyof typeof Ionicons.glyphMap

interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  name: IconTypes

  /**
   * An optional tint color for the icon
   */
  color?: string

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number

  /**
   * Style overrides for the icon container
   */
  style?: StyleProp<ViewStyle>

  /**
   * Style overrides for the icon image
   */
  iconStyle?: StyleProp<ImageStyle | ViewStyle>

  /**
   * An optional function to be called when the icon is pressed
   */
  onPress?: TouchableOpacityProps["onPress"]
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity /> if `onPress` is provided, otherwise a <View />.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Components-Icon.md)
 */
export const Icon = observer((props: IconProps) => {
  const {
    name,
    color,
    size,
    style: $containerStyleOverride,
    iconStyle: $iconStyleOverride,
    ...WrapperProps
  } = props

  const { themeStore } = useStores()

  const isPressable = !!WrapperProps.onPress
  const Wrapper: ComponentType<TouchableOpacityProps> = WrapperProps?.onPress
    ? TouchableOpacity
    : View

  return (
    <Wrapper
      accessibilityRole={isPressable ? "imagebutton" : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <Ionicons
        name={name}
        color={color ?? themeStore.colors("foreground")}
        size={size}
        style={$iconStyleOverride}
      />
    </Wrapper>
  )
})
