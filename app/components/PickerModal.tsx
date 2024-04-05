import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native"
import { Button } from "./Button"
import { Modal } from "./Modal"
import { Picker } from "./Picker"
import { Text } from "./Text"

export interface PickerModalProps {
  value: any
  onChange: (value: any) => void
  itemsList: { label: string; value: any }[]
  modalTitleTx: TxKeyPath
  wrapperStyle?: StyleProp<ViewStyle>
  disabled?: boolean
}

export const PickerModal: FC<PickerModalProps> = observer((props: PickerModalProps) => {
  const {
    value,
    onChange,
    itemsList,
    modalTitleTx,
    disabled,
    wrapperStyle: $wrapperStyleOverride,
  } = props
  const { themeStore } = useStores()
  const [modalVisible, setModalVisible] = useState(false)

  const $touchable: ViewStyle = {
    height: 40,
    width: "100%",
    borderWidth: disabled ? undefined : 1,
    borderRadius: 4,
    borderColor: themeStore.palette("neutral400"),
    justifyContent: "center",
    alignContent: "center",
    opacity: disabled ? 0.5 : 1,
  }

  return (
    <>
      <TouchableOpacity
        style={[$touchable, $wrapperStyleOverride]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
      >
        <Text
          style={styles.textAlignCenter}
          text={itemsList.find((i) => i.value === value)?.label ?? ""}
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Text tx={modalTitleTx} preset="formLabel" />
        <Picker selectedValue={value} onValueChange={onChange} itemsList={itemsList} />
        <Button tx="common.ok" preset="text" onPress={() => setModalVisible(false)} />
      </Modal>
    </>
  )
})
