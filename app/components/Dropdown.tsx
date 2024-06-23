import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { Check, ChevronDown } from "lucide-react-native"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { StyleProp, TextStyle, View, ViewStyle } from "react-native"
import { Adapt, Select, Sheet } from "tamagui"
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
  } = props
  const disabled = status === "disabled"
  const allowClearSelection = !!clearSelectionPlaceholderTx && !!clearSelectionCallback

  const { themeStore } = useStores()

  const $containerStyles = [
    {
      opacity: disabled ? 0.5 : 1,
    },
    $containerStyleOverride,
  ]
  const $labelStyles = [LabelTextProps?.style]
  const $itemStyles = [$itemStyleOverride]

  return (
    <View style={$containerStyles} pointerEvents={disabled ? "none" : undefined}>
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

      <Select value={selectedValue} onValueChange={onValueChange}>
        <Select.Trigger iconAfter={<ChevronDown color={themeStore.colors("foreground")} />}>
          <Select.Value />
        </Select.Trigger>

        {/* This is the only way for Tamagui to render Select on Native */}
        {/* See: https://tamagui.dev/ui/select/1.40.0#selectsheet */}
        <Adapt when="sm" platform="touch">
          <Sheet
            modal
            dismissOnSnapToBottom
            animationConfig={{
              type: "spring",
              damping: 20,
              mass: 1.2,
              stiffness: 250,
            }}
          >
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay
              animation="lazy"
              // eslint-disable-next-line react-native/no-inline-styles
              enterStyle={{ opacity: 0 }}
              // eslint-disable-next-line react-native/no-inline-styles
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Select.Content>
          <Select.Viewport>
            <Select.Group>
              {allowClearSelection && (
                <Select.Item index={-1} value={""} style={$itemStyles}>
                  <Select.ItemText style={$clearSelectionItemStyle}>
                    <Text tx={clearSelectionPlaceholderTx} />
                  </Select.ItemText>
                </Select.Item>
              )}
              {React.useMemo(
                () => (
                  <>
                    <Select.Label>{itemsLabel}</Select.Label>
                    {itemsList.map((item, i) => (
                      <Select.Item
                        index={i}
                        key={item.value}
                        value={item.value}
                        style={$itemStyles}
                      >
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator marginLeft="auto">
                          <Check size={16} color={themeStore.colors("foreground")} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </>
                ),
                [itemsList],
              )}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select>
    </View>
  )
})

const $clearSelectionItemStyle: TextStyle = {
  fontStyle: "italic",
}
