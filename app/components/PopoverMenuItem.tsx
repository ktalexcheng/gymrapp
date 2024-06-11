import { observer } from "mobx-react-lite"
import React from "react"
import { MenuListItem, MenuListItemProps } from "./MenuListItem"

interface PopoverMenuItemProps extends Omit<MenuListItemProps, "key" | "currentValue"> {
  currentValue?: any
}

export const PopoverMenuItem = observer(
  React.forwardRef(function PopoverMenuItem(
    props: PopoverMenuItemProps,
    forwardedRef: React.Ref<any>,
  ) {
    return (
      <MenuListItem
        ref={forwardedRef}
        minHeight={40}
        currentValue={undefined}
        OverrideRightAccessory={() => undefined}
        {...props}
      />
    )
  }),
)
