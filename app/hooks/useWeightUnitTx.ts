import { WeightUnit } from "app/data/constants"
import { ExerciseId, ExerciseSettingsType } from "app/data/types"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"
import { useExerciseSetting } from "./useExerciseSetting"

/**
 * Get the translation key path for the weight unit to be used
 * @param exerciseId (Optional) If not provided, will use the user's default weight unit
 * @returns Key path for the weight unit translation
 */
export const useWeightUnitTx = (exerciseId?: ExerciseId) => {
  const { userStore } = useStores()

  let weightUnit
  if (exerciseId) {
    ;[weightUnit] = useExerciseSetting(exerciseId, ExerciseSettingsType.WeightUnit)
  } else {
    weightUnit = userStore.getUserPreference<WeightUnit>("weightUnit")
  }

  let weightUnitTx: TxKeyPath
  switch (weightUnit) {
    case WeightUnit.kg:
      weightUnitTx = "common.kg"
      break

    case WeightUnit.lbs:
      weightUnitTx = "common.lbs"
      break

    default:
      weightUnitTx = "common.kg"
  }

  return weightUnitTx
}
