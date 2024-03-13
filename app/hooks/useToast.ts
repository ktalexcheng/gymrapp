import { TxKeyPath, translate } from "app/i18n"
import { useStores } from "app/stores"
import i18n from "i18n-js"
import Toast, { ToastOptions } from "react-native-root-toast"

interface ShowTxOptions {
  toastOptions?: ToastOptions
  txOptions?: i18n.TranslateOptions
}

export const useToast = () => {
  const { themeStore } = useStores()

  const defaultToastOptions: ToastOptions = {
    duration: Toast.durations.LONG,
    position: Toast.positions.BOTTOM - 40,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: themeStore.colors("contentBackground"),
    textColor: themeStore.colors("text"),
  }

  function toastShowTx(
    tx: TxKeyPath,
    { toastOptions = defaultToastOptions, txOptions = {} }: ShowTxOptions = {},
  ) {
    const message = translate(tx, txOptions)
    Toast.show(message, toastOptions)
  }

  return [toastShowTx]
}
