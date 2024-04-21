export enum AppLocale {
  en_US = "en",
  zh_TW = "zh",
}

export const AppLocaleLabel: {
  [key in AppLocale]: string
} = {
  [AppLocale.en_US]: "English",
  [AppLocale.zh_TW]: "繁體中文",
}

// Translation needs to be generated dynamically to react to locale changes
export const AppLocaleLabelValuePairs = () =>
  Object.entries(AppLocaleLabel).map(([value, label]) => ({
    label,
    value,
  }))
