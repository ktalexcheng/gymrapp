import { WeightUnit } from "app/data/constants"
import { roundToString } from "app/utils/formatNumber"

export class Weight {
  static LBS_IN_KG = 2.205
  #weight: number
  #weightUnit: WeightUnit
  #displayUnit: WeightUnit

  constructor(weight: number, weightUnit: WeightUnit, displayUnit: WeightUnit) {
    this.#weight = weight
    this.#weightUnit = weightUnit
    this.#displayUnit = displayUnit
  }

  setWeight(weight: number) {
    this.#weight = weight
  }

  setDisplayWeight(displayWeight: number) {
    this.#weight = Weight.convertWeight(displayWeight, this.#displayUnit, this.#weightUnit)
  }

  setWeightUnit(weightUnit: WeightUnit) {
    switch (weightUnit) {
      case WeightUnit.lbs:
        this.#weight = this.asLbs
        break

      case WeightUnit.kg:
        this.#weight = this.asKg
        break
    }
    this.#weightUnit = weightUnit
  }

  setDisplayUnit(weightUnit: WeightUnit) {
    this.#displayUnit = weightUnit
  }

  static convertWeight(weight: number, sourceUnit: WeightUnit, targetUnit: WeightUnit) {
    if (!weight) return null
    if (sourceUnit === targetUnit) return weight

    switch (targetUnit) {
      case WeightUnit.lbs:
        if (sourceUnit === WeightUnit.kg) {
          return weight * this.LBS_IN_KG
        } else {
          return weight
        }

      case WeightUnit.kg:
        if (sourceUnit === WeightUnit.lbs) {
          return weight / this.LBS_IN_KG
        } else {
          return weight
        }

      default:
        return undefined
    }
  }

  get weight(): number {
    return this.#weight
  }

  get displayWeight(): number {
    return Weight.convertWeight(this.#weight, this.#weightUnit, this.#displayUnit)
  }

  get asKg(): number {
    if (!this.#weight) return null
    if (this.#weightUnit === WeightUnit.kg) return this.#weight

    return this.#weight / Weight.LBS_IN_KG
  }

  get asLbs(): number {
    if (!this.#weight) return null
    if (this.#weightUnit === WeightUnit.lbs) return this.#weight

    return this.#weight * Weight.LBS_IN_KG
  }

  formattedDisplayWeight(decimals: number, showTrailingZero = true): string {
    return roundToString(this.displayWeight, decimals, showTrailingZero)
  }
}
