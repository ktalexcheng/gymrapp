import { WeightUnit } from "app/data/constants"
import { DefaultExerciseSettings } from "app/data/model"
import { TxKeyPath } from "app/i18n"
import { useStores } from "app/stores"

export const useWeightUnitTx = (exerciseId?: string) => {
  const { exerciseStore, userStore } = useStores()

  let weightUnit: WeightUnit
  if (exerciseId) {
    weightUnit = exerciseStore.allExercises.get(exerciseId)?.exerciseSettings?.weightUnit
  }
  if (!weightUnit && !userStore.isLoadingProfile) {
    weightUnit = userStore.user?.preferences?.weightUnit
  }
  if (!weightUnit) {
    weightUnit = DefaultExerciseSettings.weightUnit
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
