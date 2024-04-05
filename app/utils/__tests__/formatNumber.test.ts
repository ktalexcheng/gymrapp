import { roundToString, simplifyNumber } from "../formatNumber"

describe("roundToString", () => {
  it("should round a number to the specified decimal places", () => {
    expect(roundToString(3.14159, 2)).toBe("3.14")
    expect(roundToString(10.5678, 1)).toBe("10.6")
    expect(roundToString(123.456, 0)).toBe("123")
  })

  it("should show trailing zeros when specified", () => {
    expect(roundToString(5, 2, true)).toBe("5.00")
    expect(roundToString(10, 0, true)).toBe("10")
  })

  it("should not show trailing zeros when not specified", () => {
    expect(roundToString(5, 2, false)).toBe("5")
    expect(roundToString(10, 0, false)).toBe("10")
  })
})

describe("simplifyNumber", () => {
  it("should return the original number for values less than 1000", () => {
    expect(simplifyNumber(500)).toBe("500")
    expect(simplifyNumber(999)).toBe("999")
  })

  it("should simplify the number for values greater than or equal to 1000", () => {
    expect(simplifyNumber(1000)).toBe("1K")
    expect(simplifyNumber(1500)).toBe("1.5K")
    expect(simplifyNumber(1000000)).toBe("1M")
    expect(simplifyNumber(1500000000)).toBe("1.5B")
  })
})
