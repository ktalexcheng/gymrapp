import { useStores } from "app/stores"
import { styles } from "app/theme"
import { observer } from "mobx-react-lite"
import React from "react"
import { ViewStyle } from "react-native"
import { Sheet as TMGSheet, SheetProps as TMGSheetProps } from "tamagui"

interface SheetProps extends TMGSheetProps {
  showHandle?: boolean
}

const _Sheet = observer((props: SheetProps) => {
  const { themeStore } = useStores()

  const $sheetHandle: ViewStyle = {
    height: 5,
    width: 40,
    borderRadius: 5,
    backgroundColor: themeStore.colors("actionable"),
  }

  return (
    <TMGSheet
      modal={true}
      dismissOnOverlayPress={true}
      dismissOnSnapToBottom={true}
      zIndex={100_000}
      animation="medium"
      animationConfig={{
        type: "spring",
        damping: 50,
        stiffness: 500,
      }}
      {...props}
    >
      <TMGSheet.Overlay
        animation="medium"
        enterStyle={styles.invisible}
        exitStyle={styles.invisible}
      />
      {props.showHandle && <TMGSheet.Handle alignSelf="center" style={$sheetHandle} />}
      <TMGSheet.Frame
        style={{
          backgroundColor: themeStore.colors("background"),
        }}
      >
        {props.children}
      </TMGSheet.Frame>
    </TMGSheet>
  )
})

export const Sheet = Object.assign(_Sheet, {
  ScrollView: TMGSheet.ScrollView,
})
