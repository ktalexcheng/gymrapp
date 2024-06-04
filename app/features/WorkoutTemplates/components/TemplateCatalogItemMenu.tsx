import { useStores } from "app/stores"
import { spacing } from "app/theme"
import { EllipsisVertical } from "lucide-react-native"
import { observer } from "mobx-react-lite"

import { Divider, MenuListItem, Popover } from "app/components"
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
          <MenuListItem
            minHeight={40}
            itemId="editTemplateButton"
            itemNameLabelTx="templateManagerScreen.listItemMenu.editTemplateButtonLabel"
            currentValue={undefined}
            onPress={onEditTemplate}
            OverrideRightAccessory={() => undefined}
          />
        </Popover.Close>

        <Divider orientation="horizontal" spaceSize={spacing.extraSmall} />
        <Popover.Close>
          <MenuListItem
            minHeight={40}
            textColor={themeStore.colors("danger")}
            itemId="deleteTemplateButton"
            itemNameLabelTx="templateManagerScreen.listItemMenu.deleteTemplateButtonLabel"
            currentValue={undefined}
            onPress={onDeleteTemplate}
            OverrideRightAccessory={() => undefined}
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
