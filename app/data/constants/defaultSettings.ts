import { UserPreferences } from "../model"
import { AppLanguage } from "./locale"
import { WeightUnit } from "./weight"

export const DefaultUserPreferences: UserPreferences = {
  appLocale: AppLanguage.en_US,
  weightUnit: WeightUnit.kg,
  autoRestTimerEnabled: true,
  restTime: 120,
}
