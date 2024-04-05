import { WeightUnit } from "../../data/constants"
import { Weight } from "../weight"

describe("Weight", () => {
  describe("constructor", () => {
    it("should initialize weightInKg correctly", () => {
      const weight = new Weight(75)
      expect(weight.weightInKg).toBe(75)
    })
  })

  describe("setWeight", () => {
    it("should set weightInKg correctly", () => {
      const weight = new Weight(75)
      weight.setWeight(80, WeightUnit.kg)
      expect(weight.weightInKg).toBe(80)
    })
  })

  describe("getWeightInUnit", () => {
    it("should return weight in the specified unit", () => {
      const weight = new Weight(75)
      expect(weight.getWeightInUnit(WeightUnit.kg)).toBe(75)
      expect(weight.getWeightInUnit(WeightUnit.lbs)).toBeCloseTo(165.347, 3)
    })
  })

  describe("getFormattedWeightInUnit", () => {
    it("should return formatted weight in the specified unit", () => {
      const weight = new Weight(75)
      expect(weight.getFormattedWeightInUnit(WeightUnit.kg, 2)).toBe("75.00")
      expect(weight.getFormattedWeightInUnit(WeightUnit.lbs, 2)).toBe("165.38")
    })
  })

  describe("isValidWeight", () => {
    it("should return true for valid weight", () => {
      expect(Weight.isValidWeight(75)).toBe(true)
    })

    it("should return false for invalid weight", () => {
      expect(Weight.isValidWeight("asdf")).toBe(false)
      expect(Weight.isValidWeight(null)).toBe(false)
    })
  })

  describe("convertWeight", () => {
    it("should convert weight correctly between units", () => {
      expect(Weight.convertWeight(75, WeightUnit.kg, WeightUnit.lbs)).toBeCloseTo(165.375, 3)
      expect(Weight.convertWeight(165.375, WeightUnit.lbs, WeightUnit.kg)).toBeCloseTo(75, 3)
    })
  })
})
