import { AppLocale } from "app/data/constants"
import * as Localization from "expo-localization"

/**
 * Get AppLocale based on the device's locale. Only supports 繁體中文 and English, defaults to en_US.
 * @returns AppLocale based on the device's locale
 */
export const defaultAppLocale = () => {
  if (Localization.locale === "zh") {
    return AppLocale.zh_TW
  }

  return AppLocale.en_US
}
