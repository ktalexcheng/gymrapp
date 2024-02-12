import { Locale, format } from "date-fns"
import I18n from "i18n-js"

import ar from "date-fns/locale/ar-SA"
import en from "date-fns/locale/en-US"
import ko from "date-fns/locale/ko"

type Options = Parameters<typeof format>[2]

const getLocale = (): Locale => {
  const locale = I18n.currentLocale().split("-")[0]
  return locale === "ar" ? ar : locale === "ko" ? ko : en
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

  return format(date, dateFormat ?? "MMM dd, yyyy, HH:mm", dateOptions)
}
