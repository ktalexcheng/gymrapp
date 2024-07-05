import { TxKeyPath, translate } from "app/i18n"
import { useStores } from "app/stores"
import { spacing } from "app/theme"
import i18n from "i18n-js"
import { Platform, useWindowDimensions } from "react-native"
import Toast, { ToastOptions } from "react-native-root-toast"

interface ShowTxOptions {
  toastOptions?: ToastOptions
  txOptions?: i18n.TranslateOptions
}

let toast: any

export const useToast = () => {
  const { width } = useWindowDimensions()
  const { themeStore } = useStores()

  const defaultToastOptions: ToastOptions = {
    duration: Toast.durations.LONG,
    position: Toast.positions.TOP + 100,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: themeStore.colors("elevatedBackground"),
    opacity: Platform.select({ ios: 0.97, android: 0.9 }),
    textColor: themeStore.colors("text"),
    shadowColor: themeStore.colors("shadow"),
    containerStyle: {
      height: "auto",
      width: width * 0.9,
      padding: spacing.small,
      borderRadius: 8,
      borderColor: themeStore.colors("border"),
    },
  }

  function toastShowTx(
    tx: TxKeyPath,
    { toastOptions = defaultToastOptions, txOptions = {} }: ShowTxOptions = {},
  ) {
    const message = translate(tx, txOptions)
    toast && Toast.hide(toast)
    toast = Toast.show(message, toastOptions)
  }

  return [toastShowTx]
}
