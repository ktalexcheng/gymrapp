import { UserPreferences } from "../model"
import { AppColorScheme } from "./appColorScheme"
import { AppLocale } from "./locale"
import { WeightUnit } from "./weight"

export const DefaultUserPreferences: UserPreferences = {
  appColorScheme: AppColorScheme.Auto,
  appLocale: AppLocale.en_US,
  weightUnit: WeightUnit.kg,
  autoRestTimerEnabled: true,
  restTime: 120,
}
