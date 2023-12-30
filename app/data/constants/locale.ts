export enum AppLocale {
  en_US = "en-US",
  zh_TW = "zh-TW",
}

export const AppLocaleLabel: {
  [key in AppLocale]: string
} = {
  [AppLocale.en_US]: "English",
  [AppLocale.zh_TW]: "繁體中文",
}
