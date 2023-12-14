import { TxKeyPath } from "app/i18n"
import { colors, spacing, styles } from "app/theme"
import React, { FC, useState } from "react"
import { Modal, TouchableOpacity, View, ViewStyle } from "react-native"
import { Button } from "./Button"
import { Picker } from "./Picker"
import { Text } from "./Text"

export interface PickerModalProps {
  value: string
  onChange: (value: string) => void
  itemsList: { label: string; value: string }[]
  modalTitleTx: TxKeyPath
}

export const PickerModal: FC<PickerModalProps> = (props: PickerModalProps) => {
  const { value, onChange, itemsList, modalTitleTx } = props
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <TouchableOpacity style={$touchable} onPress={() => setModalVisible(true)}>
        <Text style={styles.textAlignCenter} text={value} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={$modalContainer}>
          <View style={$modalContent}>
            <Text tx={modalTitleTx} preset="formLabel" />
            <Picker selectedValue={value} onValueChange={onChange} itemsList={itemsList} />
            <Button tx="common.ok" preset="text" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  )
}

const $touchable: ViewStyle = {
  height: 40,
  width: "100%",
  borderWidth: 1,
  borderRadius: 4,
  borderColor: colors.palette.neutral400,
  justifyContent: "center",
  alignContent: "center",
}

const $modalContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.large,
}

const $modalContent: ViewStyle = {
  backgroundColor: colors.contentBackground,
  borderRadius: 20,
  padding: 35,
  width: "100%",
}
