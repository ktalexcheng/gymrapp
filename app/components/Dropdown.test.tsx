import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { Check, ChevronDown } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { StyleProp, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { RowView } from "./RowView"
import { Sheet } from "./Sheet"
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
   * Style overrides for the items
   */
  itemStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the items
   */
  itemTextStyle?: StyleProp<ViewStyle>
  /**
   *
   */
  itemsLabel?: string
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
}

/**
 * A component that allows selecting value from the platform native picker.
 */
export const Dropdown: FC<DropdownProps> = observer(function Picker(props: DropdownProps) {
  const {
    labelTx,
    label,
    labelTxOptions,
    status,
    itemsLabel,
    itemsList,
    selectedValue,
    onValueChange,
    LabelTextProps,
    clearSelectionPlaceholderTx,
    clearSelectionCallback,
    containerStyle: $containerStyleOverride,
    itemStyle: $itemStyleOverride,
    itemTextStyle: $itemTextStyleOverride,
  } = props
  const disabled = status === "disabled"
  const allowClearSelection = !!clearSelectionPlaceholderTx && !!clearSelectionCallback

  // hooks
  const { themeStore } = useStores()

  // states
  const [open, setOpen] = React.useState(false)

  // styles
  const $containerStyles: StyleProp<ViewStyle> = [
    {
      opacity: disabled ? 0.5 : 1,
      backgroundColor: themeStore.colors("contentBackground"),
      borderRadius: 8,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.tiny,
    },
    $containerStyleOverride,
  ]
  const $labelStyles: StyleProp<ViewStyle> = [LabelTextProps?.style]
  const $itemContainerStyles: StyleProp<ViewStyle> = [
    {
      backgroundColor: themeStore.colors("background"),
    },
    $itemStyleOverride,
  ]
  const $itemTextStyles: StyleProp<TextStyle> = [
    {
      color: themeStore.colors("text"),
    },
    $itemTextStyleOverride,
  ]
  const $dropdownTrigger: ViewStyle = {
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.tiny,
  }

  const handleOpenChange = (isOpen: boolean) => {
    console.debug("handleOpenChange triggered")
    setOpen(isOpen)
  }

  const DropdownItem = ({ value, children }) => {
    return (
      <TouchableOpacity onPress={() => onValueChange && onValueChange(value)}>
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={$containerStyles}>
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

      <TouchableOpacity onPress={() => handleOpenChange(true)}>
        <RowView style={$dropdownTrigger}>
          <Text>{selectedValue}</Text>
          <ChevronDown color={themeStore.colors("foreground")} />
        </RowView>
      </TouchableOpacity>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <Text>{itemsLabel}</Text>
        {allowClearSelection && (
          <DropdownItem value={undefined}>
            <Text preset="light" tx={clearSelectionPlaceholderTx} />
          </DropdownItem>
        )}
        {React.useMemo(
          () =>
            itemsList.map((item, i) => (
              <DropdownItem key={item.value} value={undefined}>
                <Text>{item.label}</Text>
                {selectedValue === item.value && (
                  <Check size={16} color={themeStore.colors("foreground")} />
                )}
              </DropdownItem>
            )),
          [itemsList],
        )}
      </Sheet>
    </View>
  )
})
