import { WeightUnit } from "app/data/constants"
import { Weight } from "app/utils/weight"
import { useRef, useState } from "react"

// This leverages the Weight class to handle weight conversions in a stateful way
// to be used in components that need to handle weight conversions
export const useWeight = (
  initWeightInKg: number | undefined | null,
  initDisplayUnit: WeightUnit,
): [number | null, number | null, (value: number) => void, (value: WeightUnit) => void] => {
  const weightUtil = useRef(new Weight(initWeightInKg))

  const [weightDisplayUnit, _setWeightDisplayUnit] = useState(initDisplayUnit)
  const [displayWeight, _setDisplayWeight] = useState(
    weightUtil.current.getWeightInUnit(initDisplayUnit),
  )
  const [weightInKg, _setWeightInKg] = useState(initWeightInKg ?? null)

  const setByDisplayWeight = (inputDisplayWeight: number) => {
    weightUtil.current.setWeight(inputDisplayWeight, weightDisplayUnit)
    _setDisplayWeight(inputDisplayWeight)
    _setWeightInKg(weightUtil.current.weightInKg)
  }

  const setDisplayUnit = (inputUnit: WeightUnit) => {
    _setWeightDisplayUnit(inputUnit)
    _setDisplayWeight(weightUtil.current.getWeightInUnit(inputUnit))
  }

  // console.debug("useWeight", { weightDisplayUnit, displayWeight, weightInKg })
  return [displayWeight, weightInKg, setByDisplayWeight, setDisplayUnit]
}
