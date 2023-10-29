import { RowView, Spacer, Text, Toggle } from "app/components"
import { TxKeyPath } from "app/i18n"
import { styles } from "app/theme"
import React from "react"
import { TouchableOpacity, View, ViewStyle } from "react-native"

type SwitchSettingTileProps = {
  titleTx: TxKeyPath
  descriptionTx: TxKeyPath
  toggleState: boolean
  onToggle: () => void
  isOnIcon?: React.ReactNode
  isOffIcon?: React.ReactNode
  containerStyle?: ViewStyle
}

export const SwitchSettingTile: React.FC<SwitchSettingTileProps> = (
  props: SwitchSettingTileProps,
) => {
  const { toggleState, onToggle, containerStyle: $containerStyleOverride } = props

  const $tileView: ViewStyle = {
    alignItems: "center",
  }

  const $description: ViewStyle = {
    flex: 8,
  }

  const $iconButton: ViewStyle = {
    flex: 1,
  }

  const SwitchIcon = () => {
    if (props.isOnIcon || props.isOffIcon) {
      return (
        <TouchableOpacity onPress={onToggle} style={$iconButton}>
          {toggleState ? props.isOnIcon : props.isOffIcon}
        </TouchableOpacity>
      )
    } else {
      return <Toggle variant="switch" value={toggleState} onPress={onToggle} />
    }
  }

  return (
    <View style={$containerStyleOverride}>
      <Text preset="formLabel" tx={props.titleTx} />
      <Spacer type="vertical" size="small" />
      <RowView style={[styles.listItemContainer, $tileView]}>
        <View style={$description}>
          <Text tx={props.descriptionTx} />
        </View>
        <SwitchIcon />
      </RowView>
    </View>
  )
}
