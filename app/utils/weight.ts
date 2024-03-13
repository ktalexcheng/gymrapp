import { WeightUnit } from "app/data/constants"
import { roundToString } from "app/utils/formatNumber"

export class Weight {
  static LBS_IN_KG = 2.205
  #weight: number | null // direct null comparison is critical, !this.#weight will not work because 0 is a valid weight
  #weightUnit: WeightUnit
  #displayUnit: WeightUnit

  constructor(weight: number | undefined | null, weightUnit: WeightUnit, displayUnit: WeightUnit) {
    this.#weight = weight ?? null
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
    if (!Number.isFinite(weight)) {
      throw new Error(`Weight.convertWeight: weight is not a finite number: ${weight}`)
    }

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
        throw new Error(`Weight.convertWeight: invalid targetUnit: ${targetUnit}`)
    }
  }

  get weight() {
    return this.#weight
  }

  get displayWeight() {
    if (this.#weight === null) return null
    return Weight.convertWeight(this.#weight, this.#weightUnit, this.#displayUnit)
  }

  get asKg() {
    if (this.#weight === null) return null
    if (this.#weightUnit === WeightUnit.kg) return this.#weight

    return this.#weight / Weight.LBS_IN_KG
  }

  get asLbs() {
    if (this.#weight === null) return null
    if (this.#weightUnit === WeightUnit.lbs) return this.#weight

    return this.#weight * Weight.LBS_IN_KG
  }

  formattedDisplayWeight(decimals: number, showTrailingZero = true): string | null {
    if (this.displayWeight === null) return null
    return roundToString(this.displayWeight, decimals, showTrailingZero)
  }
}
