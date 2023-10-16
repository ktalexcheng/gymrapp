import { RowView, Spacer, Text } from "app/components"
import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import React, { useState } from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

type SwitchSettingTileProps = {
  titleTx: TxKeyPath
  descriptionTx: TxKeyPath
  toggleState: boolean
  onToggle: (newState: boolean) => void
  isOnIcon: React.ReactNode
  isOffIcon: React.ReactNode
  containerStyle?: ViewStyle
}

export const SwitchSettingTile: React.FC<SwitchSettingTileProps> = (
  props: SwitchSettingTileProps,
) => {
  const { containerStyle: $containerStyleOverride } = props
  const [isOn, setIsOn] = useState(props.toggleState)

  const _onToggle = () => {
    props.onToggle(!isOn)
    setIsOn(!isOn)
  }

  const $tileView: ViewStyle = {
    alignItems: "center",
  }

  const $description: ViewStyle = {
    flex: 8,
  }

  const $iconButton: ViewStyle = {
    flex: 1,
  }

  return (
    <View style={$containerStyleOverride}>
      <Text preset="formLabel" tx={props.titleTx} />
      <Spacer type="vertical" size="small" />
      <RowView style={[styles.listItemContainer, $tileView]}>
        <View style={$description}>
          <Text tx={props.descriptionTx} />
        </View>
        <TouchableOpacity onPress={_onToggle} style={$iconButton}>
          {isOn ? props.isOnIcon : props.isOffIcon}
        </TouchableOpacity>
      </RowView>
    </View>
  )
}
