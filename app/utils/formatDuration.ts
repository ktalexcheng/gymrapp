export function formatDuration(d: moment.Duration, showHour = true): string {
  if (showHour) {
    const hours = Math.floor(d.asHours())
    const minutes = Math.floor(d.asMinutes()) - hours * 60
    const seconds = Math.floor(d.asSeconds()) - (hours * 60 + minutes) * 60

    return (
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0")
    )
  } else {
    const minutes = Math.floor(d.asMinutes())
    const seconds = Math.floor(d.asSeconds()) - minutes * 60

    return minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0")
  }
}
