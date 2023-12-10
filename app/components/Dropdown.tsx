import { Picker } from "@react-native-picker/picker"
import { TxKeyPath, translate } from "app/i18n"
import React, { FC } from "react"
import { StyleProp, TextStyle, TouchableOpacity, ViewStyle } from "react-native"
import { spacing } from "../theme"
import { Text, TextProps } from "./Text"

export interface DropdownProps {
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
  dropdownStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the items
   */
  itemStyle?: StyleProp<ViewStyle>
  /**
   * List of items to display in dropdown
   */
  itemsList?: { label: string; value: any }[]
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
}

/**
 * A component that allows selecting value from a dropdown using native-base
 */
export const Dropdown: FC<DropdownProps> = function Dropdown(props: DropdownProps) {
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
    dropdownStyle: $dropdownStyleOverride,
    itemStyle: $itemStyleOverride,
  } = props
  const disabled = status === "disabled"
  const allowClearSelection = !!clearSelectionPlaceholderTx && !!clearSelectionCallback

  const $containerStyles = [$containerStyleOverride]
  const $labelStyles = [$labelStyle, LabelTextProps?.style]
  const $dropdownStyles = [$dropdownStyle, $dropdownStyleOverride]
  const $itemStyles = [$itemStyle, $itemStyleOverride]

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

      {/* <Select style={$dropdownStyles} {...ISelectProps}>
        {allowClearSelection && (
          <Select.Item
            key="clearSelection"
            style={[$itemStyles, $clearSelectionItemStyle]}
            label={translate(clearSelectionPlaceholderTx)}
            value={undefined}
          />
        )}
        {itemsList.map((e) => (
          <Select.Item key={e.value} style={$itemStyles} label={e.label} value={e.value} />
        ))}
      </Select> */}

      <Picker selectedValue={selectedValue} onValueChange={onValueChange} style={$dropdownStyles}>
        {allowClearSelection && (
          <Picker.Item
            key="clearSelection"
            style={[$itemStyles, $clearSelectionItemStyle]}
            label={translate(clearSelectionPlaceholderTx)}
            value={undefined}
          />
        )}
        {itemsList.map((item) => {
          return (
            <Picker.Item
              key={item.value}
              style={$itemStyles}
              label={item.label}
              value={item.value}
            />
          )
        })}
      </Picker>
    </TouchableOpacity>
  )
}

const $labelStyle: TextStyle = {
  marginBottom: spacing.extraSmall,
}

const $dropdownStyle: ViewStyle = {
  // flexDirection: "row",
  // alignItems: "flex-start",
  // borderWidth: 1,
  // borderRadius: 4,
  // backgroundColor: colors.palette.neutral200,
  // borderColor: colors.palette.neutral400,
  // overflow: "hidden",
}

const $itemStyle: TextStyle = {
  // flex: 1,
  // alignSelf: "stretch",
  // fontFamily: typography.primary.normal,
  // color: colors.text,
  // fontSize: 16,
  // height: 24,
  // // https://github.com/facebook/react-native/issues/21720#issuecomment-532642093
  // paddingVertical: 0,
  // paddingHorizontal: 0,
  // marginVertical: spacing.extraSmall,
  // marginHorizontal: spacing.small,
}

const $clearSelectionItemStyle: TextStyle = {
  fontStyle: "italic",
}
