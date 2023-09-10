import { UserPreferences } from "../model"
import { AppLocale } from "./locale"
import { WeightUnit } from "./weight"

export const DefaultUserPreferences: UserPreferences = {
  appLocale: AppLocale.en_US,
  weightUnit: WeightUnit.kg,
  autoRestTimerEnabled: true,
  restTime: 120,
}
