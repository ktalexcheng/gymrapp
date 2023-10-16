import { WeightUnit } from "app/data/constants"
import { ExerciseId } from "app/data/model"
import { TxKeyPath } from "app/i18n"
import { useExerciseSetting } from "./useExerciseSetting"

export const useWeightUnitTx = (exerciseId?: ExerciseId) => {
  const [weightUnit] = useExerciseSetting(exerciseId, "weightUnit")

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
