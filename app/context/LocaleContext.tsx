import { AppLocale } from "app/data/constants"
import { storage, storageKeys } from "app/services"
import * as Localization from "expo-localization"
import i18n from "i18n-js"
import React from "react"

const systemLocale = Localization.getLocales()[0].languageCode as AppLocale
i18n.locale = systemLocale

type LocaleContextType = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  isInitialized: boolean
}

const LocaleContext = React.createContext<LocaleContextType>({} as any)

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  console.debug("LocaleProvider", { systemLocale })
  const [locale, setContextLocale] = React.useState<AppLocale>(systemLocale)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    if (isInitialized) return

    storage
      .getData(storageKeys.APP_LOCALE, true)
      .then((locale) => {
        if (locale) {
          console.debug("LocaleContext using stored locale", { locale })
          setLocale(locale)
        }
      })
      .finally(() => {
        setIsInitialized(true)
      })
  }, [])

  const setLocale = (locale: AppLocale) => {
    console.debug("LocaleContext.setLocale()", { locale })
    setContextLocale(locale as AppLocale)
    i18n.locale = locale
    storage.storeData(storageKeys.APP_LOCALE, locale)
  }

  const contextValue = React.useMemo(
    () =>
      ({
        locale,
        setLocale,
        isInitialized,
      } as LocaleContextType),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>
}

export const useLocale = () => React.useContext(LocaleContext)
