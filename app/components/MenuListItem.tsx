import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { useState } from "react"
import { TouchableOpacity, ViewStyle } from "react-native"
import { Button } from "./Button"
import { Icon } from "./Icon"
import { Modal } from "./Modal"
import { RowView } from "./RowView"
import { Spacer } from "./Spacer"
import { Text } from "./Text"

export type MenuListItemProps = {
  disabled?: boolean
  required?: boolean
  itemId: string
  itemNameLabelTx?: TxKeyPath
  itemNameLabel?: string
  itemDescriptionLabelTx?: TxKeyPath
  currentValue: any
  currentValueFormatted?: any
  TooltipComponent?: React.ComponentType
  overrideOnPress?: () => void
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
}

export const MenuListItem = observer((props: MenuListItemProps) => {
  const {
    disabled = false,
    required = false,
    itemId,
    itemNameLabelTx,
    itemNameLabel,
    itemDescriptionLabelTx,
    currentValue,
    currentValueFormatted,
    TooltipComponent,
    overrideOnPress,
    OverrideRightAccessory,
    onValueChange,
    PickerComponent,
  } = props

  const [showModal, setShowModal] = useState(false)
  const [selectedValue, setSelectedValue] = useState<any>(currentValue)

  const $container: ViewStyle = {
    alignItems: "center",
    justifyContent: "space-between",
  }

  const $preferenceLabelContainer: ViewStyle = {
    flex: 1,
    alignItems: "center",
    overflow: "hidden",
  }

  const MenuListItemDisplay = ({ currentValueFormatted }) => {
    return (
      <RowView style={[$container, disabled && styles.disabled]}>
        <RowView style={$preferenceLabelContainer}>
          <Text tx={itemNameLabelTx} text={itemNameLabel} preset="formLabel" />
          {required && <Text text="*" preset="formLabel" />}
          {TooltipComponent && (
            <>
              <Spacer type="horizontal" size="tiny" />
              <TooltipComponent />
            </>
          )}
        </RowView>
        <RowView style={styles.alignCenter}>
          <Text text={currentValueFormatted} />
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
      <TouchableOpacity key={itemId} disabled={disabled} onPress={overrideOnPress}>
        <MenuListItemDisplay currentValueFormatted={currentValueFormatted ?? currentValue} />
      </TouchableOpacity>
    )
  } else if (!PickerComponent || !onValueChange) {
    console.error(
      "PreferenceListItem: PickerComponent and onValueChange are required if overrideOnPress is not provided",
    )
    return null
  }

  // console.debug("PreferenceListItem", {
  //   preferenceId,
  //   preferenceNameLabelTx,
  //   preferenceDescriptionLabelTx,
  //   currentValue,
  //   currentValueFormatted,
  //   disabled,
  //   showModal,
  //   selectedValue,
  // })
  return (
    <>
      <TouchableOpacity key={itemId} disabled={disabled} onPress={() => setShowModal(true)}>
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
})
