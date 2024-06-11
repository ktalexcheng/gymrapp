import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"

import { Divider, Popover, PopoverMenuItem } from "app/components"
import React from "react"
import { View, ViewStyle } from "react-native"

type TemplateCatalogItemMenuProps = {
  onEditTemplate: () => void
  onDeleteTemplate: () => void
}

export const TemplateCatalogItemMenu = observer((props: TemplateCatalogItemMenuProps) => {
  const { onEditTemplate, onDeleteTemplate } = props
  const { themeStore } = useStores()

  return (
    <View style={$container}>
      <Popover trigger={<EllipsisVertical color={themeStore.colors("text")} />}>
        <Popover.Close>
          <PopoverMenuItem
            itemNameLabelTx="templateManagerScreen.listItemMenu.editTemplateButtonLabel"
            onPress={onEditTemplate}
          />
        </Popover.Close>

        <Divider orientation="horizontal" spaceSize={spacing.tiny} />
        <Popover.Close>
          <PopoverMenuItem
            itemNameLabelTx="templateManagerScreen.listItemMenu.deleteTemplateButtonLabel"
            textColor={themeStore.colors("danger")}
            onPress={onDeleteTemplate}
          />
        </Popover.Close>
      </Popover>
    </View>
  )
})

const $container: ViewStyle = {
  paddingRight: spacing.tiny,
  paddingTop: spacing.tiny,
  justifyContent: "flex-end",
}
