import { TxKeyPath, translate } from "app/i18n"
import { useStores } from "app/stores"
import Toast, { ToastOptions } from "react-native-root-toast"

export const useToast = () => {
  const { themeStore } = useStores()

  const defaultOptions: ToastOptions = {
    duration: Toast.durations.LONG,
    position: Toast.positions.TOP + 40,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: themeStore.colors("contentBackground"),
    textColor: themeStore.colors("text"),
  }

  function showTx(tx: TxKeyPath, options = defaultOptions) {
    Toast.show(translate(tx), options)
  }

  return [showTx]
}
