import { translate } from "app/i18n"

export enum AppColorScheme {
  Light = "light",
  Dark = "dark",
  Auto = "auto",
}

// Translation needs to be generated dynamically to react to locale changes
export const AppColorSchemeLabelValuePairs = () =>
  Object.values(AppColorScheme).map((value) => ({
    // @ts-ignore: We need to generate the translation keys dynamically
    label: translate(`common.colorScheme.${value}`),
    value,
  }))
