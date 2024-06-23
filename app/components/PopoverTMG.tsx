import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React from "react"
import { TouchableOpacity, View, ViewProps } from "react-native"
import { Popover, PopoverCloseProps as _PopoverCloseProps } from "tamagui"

interface PopoverContainerProps extends ViewProps {
  /**
   * If this is a functional component, wrap it in a forwardRef
   */
  trigger: React.ReactNode
  /**
   * Position of the popover relative to the trigger, defaults to "bottom"
   */
  placement?: PopoverPlacementTMG
}

const PopoverContainer = observer((props: PopoverContainerProps) => {
  const { trigger, placement: _placement, children } = props

  // hooks
  const { themeStore } = useStores()

  // derived state
  // abstraction from the library's placement enum to our own
  const placement = _placement ?? PopoverPlacementTMG.BottomEnd

  return (
    <Popover placement={placement}>
      <Popover.Trigger asChild>
        {/* // Wrap in TouchableOpacity to make sure the entire view of the children pressable */}
        <TouchableOpacity>{trigger}</TouchableOpacity>
      </Popover.Trigger>

      <Popover.Content
        unstyled
        elevate
        style={{
          ...themeStore.styles("menuPopoverContainer"),
          gap: undefined, // gap is not a valid Tamagui component prop
        }}
        // eslint-disable-next-line react-native/no-inline-styles
        enterStyle={{ y: -10, opacity: 0 }}
        // eslint-disable-next-line react-native/no-inline-styles
        exitStyle={{ y: -10, opacity: 0 }}
        animation={[
          "quick",
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <View
          style={{
            // Apply gap styling here in a view because it's not a valid Tamagui component prop
            gap: themeStore.styles("menuPopoverContainer").gap,
          }}
        >
          {children}
        </View>
      </Popover.Content>
    </Popover>
  )
})

// we have no use case for any other placements yet
export enum PopoverPlacementTMG {
  BottomEnd = "bottom-end",
}

interface PopoverCloseProps extends _PopoverCloseProps {
  children: React.ReactNode
}

const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverCloseProps,
  forwardedRef: React.Ref<any>,
) {
  return <Popover.Close {...props} ref={forwardedRef} asChild flexDirection="row" />
})

export const PopoverTMG = Object.assign(PopoverContainer, { Close: PopoverClose })
