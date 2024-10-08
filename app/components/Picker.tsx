import { Picker as RNPicker } from "@react-native-picker/picker"
import { TxKeyPath, translate } from "app/i18n"
import { useStores } from "app/stores"
import { typography } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { Platform, StyleProp, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { Text, TextProps } from "./Text"

export interface PickerProps {
  /**
   * A style modifier for different input states.
   */
  status?: "error" | "disabled"
  /**
   * The label text to display if not using `labelTx`.
   */
  label?: TextProps["text"]
  /**
   * Label text which is looked up via i18n.
   */
  labelTx?: TextProps["tx"]
  /**
   * Optional label options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  labelTxOptions?: TextProps["txOptions"]
  /**
   * Pass any additional props directly to the label Text component.
   */
  LabelTextProps?: TextProps
  /**
   * Style overrides for the container
   */
  containerStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the dropdown
   */
  pickerStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the items
   */
  itemStyle?: StyleProp<ViewStyle>
  /**
   * List of items to display in dropdown
   */
  itemsList: { label: string; value: any }[]
  /**
   * The currently selected value
   */
  selectedValue?: any
  /**
   * Callback when the selected value changes
   */
  onValueChange?: (value: any) => void
  /**
   * The placeholder text to display for first item in the dropdown that deselects the current value
   */
  clearSelectionPlaceholderTx?: TxKeyPath
  /**
   * Callback to deselect the current value
   */
  clearSelectionCallback?: () => void
  /**
   * Android only: Set the picker mode to "dialog" or "dropdown"
   */
  androidPickerMode?: "dialog" | "dropdown"
}

/**
 * A component that allows selecting value from the platform native picker.
 */
export const Picker: FC<PickerProps> = observer(function Picker(props: PickerProps) {
  const {
    labelTx,
    label,
    labelTxOptions,
    status,
    itemsList,
    selectedValue,
    onValueChange,
    LabelTextProps,
    clearSelectionPlaceholderTx,
    clearSelectionCallback,
    containerStyle: $containerStyleOverride,
    pickerStyle: $pickerStyleOverride,
    itemStyle: $itemStyleOverride,
    androidPickerMode = "dialog",
  } = props
  const disabled = status === "disabled"
  const allowClearSelection = !!clearSelectionPlaceholderTx && !!clearSelectionCallback

  const { themeStore } = useStores()

  const pickerPopoverTextColor = () => {
    if (themeStore.isDark && Platform.OS === "android") {
      // On Android with dark mode, react-native-picker does not support styling the popover text color
      // so leave the text unstyled (i.e. black text on white background)
      return undefined
    } else {
      return themeStore.colors("text")
    }
  }

  const $containerStyles = [$containerStyleOverride]
  const $labelStyles = [LabelTextProps?.style]
  const $pickerStyles = [
    {
      color: themeStore.colors("text"), // On Android, this is the color of the picker prompt (not the modal); no effect on iOS
      fontFamily: typography.primary.normal,
    },
    $pickerStyleOverride,
  ]
  const $itemStyles = [$itemStyleOverride]

  return (
    <TouchableOpacity activeOpacity={1} style={$containerStyles} accessibilityState={{ disabled }}>
      {!!(label || labelTx) && (
        <Text
          preset="formLabel"
          text={label}
          tx={labelTx}
          txOptions={labelTxOptions}
          {...LabelTextProps}
          style={$labelStyles}
        />
      )}

      <RNPicker
        mode={androidPickerMode}
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={$pickerStyles}
        dropdownIconColor={themeStore.colors("text")}
        dropdownIconRippleColor={themeStore.colors("text")}
      >
        {allowClearSelection && (
          <RNPicker.Item
            key="clearSelection"
            style={[$itemStyles, $clearSelectionItemStyle]}
            color={pickerPopoverTextColor()} // On Android, this is the color of the modal text; on iOS this is wheel picker text
            label={translate(clearSelectionPlaceholderTx)}
            value={undefined}
          />
        )}
        {itemsList.map((item) => {
          return (
            <RNPicker.Item
              key={item.value}
              style={$itemStyles}
              color={pickerPopoverTextColor()} // On Android, this is the color of the modal text; on iOS this is wheel picker text
              label={item.label}
              value={item.value}
            />
          )
        })}
      </RNPicker>
    </TouchableOpacity>
  )
})

const $clearSelectionItemStyle: TextStyle = {
  fontStyle: "italic",
}
