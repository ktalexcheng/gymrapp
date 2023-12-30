export function formatSecondsAsTime(
  totalSeconds: number,
  showHour?: boolean,
  padZero = true,
): string {
  const _totalSeconds = Math.abs(totalSeconds)
  const _hours = showHour ? Math.floor(_totalSeconds / 3600) : 0
  const _minutes = Math.floor((_totalSeconds - _hours * 3600) / 60)
  const _seconds = _totalSeconds - _hours * 3600 - _minutes * 60

  const formattedSeconds = padZero ? _seconds.toString().padStart(2, "0") : _seconds.toString()
  const formattedMinutes = padZero ? _minutes.toString().padStart(2, "0") : _minutes.toString()

  let formattedTime = `${formattedMinutes}:${formattedSeconds}`

  if (showHour || _hours > 0) {
    const formattedHours = padZero ? _hours.toString().padStart(2, "0") : _hours.toString()
    formattedTime = `${formattedHours}:${formattedTime}`
  }

  return formattedTime
}
