import { WeightUnit } from "app/data/constants"
import { Weight } from "app/utils/weight"
import { useState } from "react"

export const useWeight = (
  initWeightkg: number | null,
  initDisplayUnit: WeightUnit,
): [number | null, number | null, (value: number) => void, (value: WeightUnit) => void] => {
  const weightUtil = new Weight(initWeightkg, WeightUnit.kg, initDisplayUnit)

  const [displayWeight, _setDisplayWeight] = useState(weightUtil.displayWeight)
  const [weightKg, _setWeightKg] = useState(weightUtil.asKg)

  const setDisplayWeight = (value: number) => {
    weightUtil.setDisplayWeight(value)
    _setDisplayWeight(value)
    _setWeightKg(weightUtil.asKg)
    console.debug("useWeight weightUtil.asKg:", weightUtil.asKg)
  }

  const setDisplayUnit = (value: WeightUnit) => {
    weightUtil.setWeightUnit(value)
    weightUtil.setDisplayUnit(value)
    console.debug("useWeight weightUtil.displayWeight:", weightUtil.displayWeight)
    _setDisplayWeight(weightUtil.displayWeight)
  }

  return [displayWeight, weightKg, setDisplayWeight, setDisplayUnit]
}
