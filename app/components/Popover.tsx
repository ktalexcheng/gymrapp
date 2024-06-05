import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { createContext, useContext, useState } from "react"
import { Easing, TouchableOpacity, TouchableOpacityProps, View, ViewProps } from "react-native"
import _Popover, { PopoverPlacement as _PopoverPlacement } from "react-native-popover-view"

// Create a new context
type PopoverContextValue = {
  onOpenChange: (isOpen: boolean) => void
}

const PopoverContext = createContext<PopoverContextValue>({} as any)

interface PopoverContainerProps extends ViewProps {
  /**
   * If this is a functional component, wrap it in a forwardRef
   */
  trigger: React.ReactNode
  /**
   * Position of the popover relative to the trigger, defaults to "bottom"
   */
  placement?: PopoverPlacement
}

const PopoverContainer = observer((props: PopoverContainerProps) => {
  const { trigger, placement: _placement, children } = props

  // utilities
  const { themeStore } = useStores()

  // states
  const [isOpen, setIsOpen] = useState(false)

  // derived state
  // abstraction from the library's placement enum to our own
  const placement = _PopoverPlacement[_placement ?? PopoverPlacement.BottomEnd]

  const contextValue = {
    onOpenChange: setIsOpen,
  } as PopoverContextValue

  return (
    // Popover position will be relative to the parent container
    // so wrap in a View to make sure the popover is positioned correctly
    <PopoverContext.Provider value={contextValue}>
      <View>
        <_Popover
          from={
            // Wrap in TouchableOpacity to make sure the entire view of the children pressable
            <TouchableOpacity onPress={() => setIsOpen(true)}>{trigger}</TouchableOpacity>
          }
          popoverStyle={themeStore.styles("menuPopoverContainer")}
          placement={placement}
          isVisible={isOpen}
          onRequestClose={() => setIsOpen(false)}
          // make animation immediate
          animationConfig={{
            delay: 0,
            duration: 100,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }}
        >
          {children}
        </_Popover>
      </View>
    </PopoverContext.Provider>
  )
})

// react-native-popover-view only has a "bottom" placement
// that corrects for the position on the screen (to not overflow)
// we have no use case for any other placements yet
export enum PopoverPlacement {
  BottomEnd = _PopoverPlacement.BOTTOM,
}

interface PopoverCloseProps extends TouchableOpacityProps {}

const PopoverClose = (props: PopoverCloseProps) => {
  const context = useContext(PopoverContext)

  const child = React.Children.only(props.children)
  if (!React.isValidElement(child)) {
    throw new Error("Popover.Close must have only one child")
  }
  if (typeof child.props.onPress !== "function") {
    throw new Error("The child of Popover.Close must have an onPress prop")
  }

  const ChildWithClose = React.cloneElement(child as any, {
    onPress: () => {
      context.onOpenChange(false)
      child.props.onPress()
    },
  })

  return ChildWithClose
}

export const Popover = Object.assign(PopoverContainer, { Close: PopoverClose })
