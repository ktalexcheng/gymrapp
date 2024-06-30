import { Locale, format } from "date-fns"
import I18n from "i18n-js"

import en from "date-fns/locale/en-US"
import zh from "date-fns/locale/zh-TW"

type Options = Parameters<typeof format>[2]

const getLocale = (): Locale => {
  const locale = I18n.currentLocale().split("-")[0]
  switch (locale) {
    case "en":
      // @ts-ignore: It is the correct type, not sure why TS is complaining
      return en
    case "zh":
      // @ts-ignore: It is the correct type, not sure why TS is complaining
      return zh
    default:
      // @ts-ignore: It is the correct type, not sure why TS is complaining
      return en
  }
}

const getDefaultDateTimeFormat = () => {
  const locale = I18n.currentLocale().split("-")[0]
  switch (locale) {
    case "en":
      return "MMM dd yyyy, HH:mm"
    case "zh":
      return "yyyy年MM月dd日 HH:mm"
    default:
      return "MMM dd yyyy, HH:mm"
  }
}

export const formatDateTime = (
  date: Date | string | number,
  dateFormat?: string,
  options?: Options,
) => {
  if (!date) return undefined
  if (typeof date === "string") date = new Date(date)
  if (typeof date === "number") date = new Date(date)

  const locale = getLocale()
  const dateOptions = {
    ...options,
    locale,
  }

  return format(date, dateFormat ?? getDefaultDateTimeFormat(), dateOptions)
}

const getDefaultDateFormat = () => {
  const locale = I18n.currentLocale().split("-")[0]
  switch (locale) {
    case "en":
      return "MMM dd yyyy"
    case "zh":
      return "yyyy年MM月dd日"
    default:
      return "MMM dd yyyy"
  }
}

export const formatDate = (
  date: Date | string | number,
  dateFormat?: string,
  options?: Options,
) => {
  if (!date) return undefined
  if (typeof date === "string") date = new Date(date)
  if (typeof date === "number") date = new Date(date)

  const locale = getLocale()
  const dateOptions = {
    ...options,
    locale,
  }

  return format(date, dateFormat ?? getDefaultDateFormat(), dateOptions)
}
