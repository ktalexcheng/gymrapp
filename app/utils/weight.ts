import { WeightUnit } from "app/data/constants"
import { roundToString } from "./formatNumber"

// export class Weight {
//   static LBS_IN_KG = 2.205
//   #weight: number | null // strict null comparison is critical, !this.#weight will not work because 0 is a valid weight
//   #weightUnit: WeightUnit
//   #displayUnit: WeightUnit

//   constructor(weight: number | undefined | null, weightUnit: WeightUnit, displayUnit: WeightUnit) {
//     this.#weight = weight ?? null
//     this.#weightUnit = weightUnit
//     this.#displayUnit = displayUnit
//   }

//   setWeight(weight: number) {
//     this.#weight = weight
//   }

//   setDisplayWeight(displayWeight: number) {
//     this.#weight = Weight.convertWeight(displayWeight, this.#displayUnit, this.#weightUnit)
//   }

//   setWeightUnit(weightUnit: WeightUnit) {
//     switch (weightUnit) {
//       case WeightUnit.lbs:
//         this.#weight = this.asLbs
//         break

//       case WeightUnit.kg:
//         this.#weight = this.asKg
//         break
//     }
//     this.#weightUnit = weightUnit
//   }

//   setDisplayUnit(weightUnit: WeightUnit) {
//     this.#displayUnit = weightUnit
//   }

//   static convertWeight(weight: number, sourceUnit: WeightUnit, targetUnit: WeightUnit) {
//     if (!Number.isFinite(weight)) {
//       throw new Error(`Weight.convertWeight: weight is not a finite number: ${weight}`)
//     }

//     if (sourceUnit === targetUnit) return weight

//     switch (targetUnit) {
//       case WeightUnit.lbs:
//         if (sourceUnit === WeightUnit.kg) {
//           return weight * this.LBS_IN_KG
//         } else {
//           return weight
//         }

//       case WeightUnit.kg:
//         if (sourceUnit === WeightUnit.lbs) {
//           return weight / this.LBS_IN_KG
//         } else {
//           return weight
//         }

//       default:
//         throw new Error(`Weight.convertWeight: invalid targetUnit: ${targetUnit}`)
//     }
//   }

//   get weight() {
//     return this.#weight
//   }

//   get displayWeight() {
//     if (this.#weight === null) return null
//     return Weight.convertWeight(this.#weight, this.#weightUnit, this.#displayUnit)
//   }

//   get asKg() {
//     if (this.#weight === null) return null
//     if (this.#weightUnit === WeightUnit.kg) return this.#weight

//     return this.#weight / Weight.LBS_IN_KG
//   }

//   get asLbs() {
//     if (this.#weight === null) return null
//     if (this.#weightUnit === WeightUnit.lbs) return this.#weight

//     return this.#weight * Weight.LBS_IN_KG
//   }

//   formattedDisplayWeight(decimals: number, showTrailingZero = true): string | null {
//     if (this.displayWeight === null) return null
//     return roundToString(this.displayWeight, decimals, showTrailingZero)
//   }
// }

export class Weight {
  static LBS_IN_KG = 2.205
  weightInKg: number | null // Always stored in KG, converted to display unit when accessed

  constructor(weightInKg: number | undefined | null) {
    this.weightInKg = weightInKg ?? null
  }

  setWeight(weight: number | undefined | null, unit: WeightUnit) {
    if (!Weight.isValidWeight(weight)) {
      this.weightInKg = null
    } else {
      this.weightInKg = Weight.convertWeight(weight, unit, WeightUnit.kg)
    }
  }

  getWeightInUnit(unit: WeightUnit) {
    if (this.weightInKg == null) return null
    return Weight.convertWeight(this.weightInKg, WeightUnit.kg, unit)
  }

  getFormattedWeightInUnit(unit: WeightUnit, decimals: number, showTrailingZero = true) {
    const weight = this.getWeightInUnit(unit)
    return roundToString(weight ?? 0, decimals, showTrailingZero) // we never want to show null to user, so we assume null is 0
  }

  static isValidWeight(weight: any) {
    // loose comparison is intentional, null is loosely equal to undefined
    // weight < 0 is allowed
    if (weight == null || !Number.isFinite(weight)) return false
    return true
  }

  static convertWeight(
    weight: number | undefined | null,
    sourceUnit: WeightUnit,
    targetUnit: WeightUnit,
  ) {
    if (!Weight.isValidWeight(weight)) {
      console.error(`Weight.convertWeight: weight is not a finite number: ${weight}`)
      return null
    }

    // isValidWeight ensures weight is not null or undefined, so we can safely use the non-null assertion operator
    if (sourceUnit === targetUnit) return weight!
    switch (sourceUnit) {
      case WeightUnit.lbs:
        switch (targetUnit) {
          case WeightUnit.kg:
            return weight! / Weight.LBS_IN_KG
          default:
            console.error(`Weight.convertWeight: invalid targetUnit: ${sourceUnit}`)
            return null
        }
      case WeightUnit.kg:
        switch (targetUnit) {
          case WeightUnit.lbs:
            return weight! * Weight.LBS_IN_KG
          default:
            console.error(`Weight.convertWeight: invalid targetUnit: ${sourceUnit}`)
            return null
        }
      default:
        console.error(`Weight.convertWeight: invalid sourceUnit: ${sourceUnit}`)
        return null
    }
  }
}
