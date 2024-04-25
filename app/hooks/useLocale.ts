import { AppLocale } from "app/data/constants"
import { storage, storageKeys } from "app/services"
import * as Localization from "expo-localization"
import i18n from "i18n-js"
import { useEffect, useState } from "react"
import { I18nManager } from "react-native"

export function useLocale(): [
  locale: AppLocale,
  setLocale: (locale: AppLocale) => void,
  isLoading: boolean,
] {
  const defaultLocale = Localization.getLocales()[0]

  const [locale, _setLocale] = useState((defaultLocale?.languageCode || "en") as AppLocale)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    storage
      .getData(storageKeys.APP_LOCALE, true)
      .then((locale) => {
        if (locale) {
          setLocale(locale as AppLocale)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  function setLocale(locale: AppLocale) {
    setIsLoading(true)

    i18n.locale = locale
    // handle RTL languages
    const isRTL = (defaultLocale?.textDirection ?? "rtl") === "rtl"
    I18nManager.allowRTL(isRTL)
    I18nManager.forceRTL(isRTL)

    storage
      .storeData(storageKeys.APP_LOCALE, locale)
      .then(() => {
        _setLocale(locale)
      })
      .finally(() => setIsLoading(false))
  }

  // console.debug("useLocale():", { locale, setLocale, isLoading })
  return [locale, setLocale, isLoading]
}
