import { WeightUnit } from "app/data/constants"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"

export const useWeightUnitTx = (exerciseId?: string) => {
  const { exerciseStore } = useStores()

  let weightUnit: WeightUnit
  if (exerciseId) {
    weightUnit = exerciseStore.allExercises.get(exerciseId).getExerciseSetting("weightUnit")
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
