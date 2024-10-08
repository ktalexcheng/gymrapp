import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import {
  Modal as RNModal,
  ModalProps as RNModalProps,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"

interface ModalProps extends RNModalProps {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const Modal: FC<ModalProps> = observer((props: ModalProps) => {
  const {
    style: $containerStyleOverride,
    contentContainerStyle: $contentContainerStyleOverride,
    children,
    onRequestClose,
    ...rest
  } = props
  const { themeStore } = useStores()

  const $containerBase: ViewStyle = {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    backgroundColor: themeStore.colors("background") + "80",
  }

  const $container = [$containerBase, $containerStyleOverride]

  const $contentContainer = [themeStore.styles("modalContent"), $contentContainerStyleOverride]

  return (
    <RNModal {...rest} onRequestClose={onRequestClose} animationType="fade">
      {/* Overlay */}
      <TouchableOpacity style={$container} onPress={onRequestClose}>
        {/* Dialog */}
        <View style={$contentContainer}>{children}</View>
      </TouchableOpacity>
    </RNModal>
  )
})
