export function roundToString(input: number, decimals: number, showTrailingZero = true): string {
  if (!Number.isFinite(input)) return null

  const roundingBase = 10 ** decimals
  const roundedWeight = Math.round(input * roundingBase) / roundingBase

  if (showTrailingZero) {
    return roundedWeight.toFixed(decimals)
  } else {
    return String(parseFloat(roundedWeight.toFixed(decimals)))
  }
}

enum NumberUnit {
  Thousands = "K",
  Millions = "M",
  Billions = "B",
}

/**
 * Simplifies a number to 2 significant digits for anything >= 1000
 * @param input A number to be simplified
 * @returns Original number for anything <1000, then 2 significant digits for anything >=1000
 */
export function simplifyNumber(input: number): string {
  if (!Number.isFinite(input)) return null

  // If the number is negative, return the absolute value with a negative sign
  if (input < 0) return "-" + simplifyNumber(Math.abs(input))

  // If the number is less than 1000, return the original number
  if (input < 1000) return String(input)

  // Unit should be K for thousands, M for millions, B for billions
  let simplifiedNumber
  let unit
  if (input >= 1000 && input < 10000) {
    simplifiedNumber = roundToString(input / 1000, 1, false)
    unit = NumberUnit.Thousands
  } else if (input >= 10000 && input < 1000000) {
    simplifiedNumber = roundToString(input / 1000, 0, false)
    unit = NumberUnit.Thousands
  } else if (input >= 1000000 && input < 10000000) {
    simplifiedNumber = roundToString(input / 1000000, 1, false)
    unit = NumberUnit.Millions
  } else if (input >= 10000000 && input < 1000000000) {
    simplifiedNumber = roundToString(input / 1000000, 0, false)
    unit = NumberUnit.Millions
  } else if (input >= 1000000000) {
    simplifiedNumber = roundToString(input / 1000000000, 1, false)
    unit = NumberUnit.Billions
  }

  return simplifiedNumber + unit
}
