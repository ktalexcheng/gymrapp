export function roundToString(input: number, decimals: number, showTrailingZero = true): string {
  if (!input) return null

  const roundingBase = 10 ** decimals
  const roundedWeight = Math.round(input * roundingBase) / roundingBase

  if (showTrailingZero) {
    return roundedWeight.toFixed(decimals)
  } else {
    return String(parseFloat(roundedWeight.toFixed(decimals)))
  }
}
