import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle } from "react-native"
import { Button } from "./Button"
import { Icon } from "./Icon"
import { Modal } from "./Modal"
import { RowView } from "./RowView"
import { Spacer } from "./Spacer"
import { Text } from "./Text"

export interface MenuListItemProps extends TouchableOpacityProps {
  disabled?: boolean
  required?: boolean
  itemNameLabelTx?: TxKeyPath
  itemNameLabel?: string
  itemDescriptionLabelTx?: TxKeyPath
  currentValue: any
  currentValueFormatted?: any
  TooltipComponent?: React.ComponentType
  OverrideRightAccessory?: React.ComponentType
  onValueChange?: (value: any) => void
  /**
   * selectedValue and onSelectionChange control the temporary state of the picker,
   * the final value is only pass to onValueChange when the user confirms the selection
   */
  PickerComponent?: React.ComponentType<{
    selectedValue: any
    onSelectionChange: (value: any) => void
  }>
  minHeight?: number
  textColor?: string
}

export const MenuListItem = observer(
  React.forwardRef(function MenuListItem(props: MenuListItemProps, forwardedRef: React.Ref<any>) {
    const {
      disabled = false,
      required = false,
      itemNameLabelTx,
      itemNameLabel,
      itemDescriptionLabelTx,
      currentValue,
      currentValueFormatted,
      TooltipComponent,
      onPress: overrideOnPress,
      OverrideRightAccessory,
      onValueChange,
      PickerComponent,
      minHeight,
      textColor,
      ...rest
    } = props

    const [showModal, setShowModal] = useState(false)
    const [selectedValue, setSelectedValue] = useState<any>(currentValue)

    const $container: StyleProp<ViewStyle> = [
      {
        alignItems: "center",
        justifyContent: "space-between",
      },
      minHeight !== undefined && { minHeight },
    ]

    const $preferenceLabelContainer: ViewStyle = {
      alignItems: "center",
      overflow: "hidden",
    }

    const MenuListItemDisplay = ({ currentValueFormatted }) => {
      return (
        <RowView style={[$container, disabled && styles.disabled]}>
          <RowView style={$preferenceLabelContainer}>
            <Text
              tx={itemNameLabelTx}
              text={itemNameLabel}
              preset="formLabel"
              textColor={textColor}
            />
            {required && <Text text="*" preset="formLabel" />}
            {TooltipComponent && (
              <>
                <Spacer type="horizontal" size="tiny" />
                <TooltipComponent />
              </>
            )}
          </RowView>
          <RowView style={[styles.flex1, styles.alignCenter]}>
            <Spacer type="horizontal" size="small" />
            <Text
              style={styles.flex1}
              numberOfLines={1}
              textAlign="right"
              text={currentValueFormatted}
            />
            {OverrideRightAccessory ? (
              <OverrideRightAccessory />
            ) : (
              <Icon name="chevron-forward-outline" size={30} />
            )}
          </RowView>
        </RowView>
      )
    }

    if (overrideOnPress) {
      return (
        <TouchableOpacity ref={forwardedRef} disabled={disabled} onPress={overrideOnPress}>
          <MenuListItemDisplay currentValueFormatted={currentValueFormatted ?? currentValue} />
        </TouchableOpacity>
      )
    } else if (!PickerComponent || !onValueChange) {
      console.error(
        "PreferenceListItem: PickerComponent and onValueChange are required if overrideOnPress is not provided",
      )
      return null
    }

    return (
      <>
        <TouchableOpacity
          ref={forwardedRef}
          disabled={disabled}
          onPress={() => setShowModal(true)}
          {...rest}
        >
          <MenuListItemDisplay currentValueFormatted={currentValueFormatted ?? currentValue} />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          {itemDescriptionLabelTx && <Text tx={itemDescriptionLabelTx} />}
          <PickerComponent selectedValue={selectedValue} onSelectionChange={setSelectedValue} />
          <Button
            tx="common.ok"
            preset="text"
            onPress={() => {
              onValueChange(selectedValue)
              setShowModal(false)
            }}
          />
        </Modal>
      </>
    )
  }),
)
