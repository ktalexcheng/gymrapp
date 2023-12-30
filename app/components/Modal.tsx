import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import {
  Modal as RCModal,
  ModalProps as RCModalProps,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"

interface ModalProps extends RCModalProps {
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

  const $container = [$containerBase, $containerStyleOverride]

  const $contentContainer = [themeStore.styles("modalContent"), $contentContainerStyleOverride]

  return (
    <RCModal {...rest} onRequestClose={onRequestClose}>
      <TouchableOpacity style={$container} onPress={onRequestClose}>
        <View style={$contentContainer}>{children}</View>
      </TouchableOpacity>
    </RCModal>
  )
})

const $containerBase: ViewStyle = {
  flex: 1,
  alignContent: "center",
  justifyContent: "center",
}
