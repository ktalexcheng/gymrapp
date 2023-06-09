import { useStores } from "app/stores"
import moment from "moment"
import { useEffect, useState } from "react"
import { formatDuration } from "./formatDuration"

export const useTimeElapsed = () => {
  const { workoutStore } = useStores()
  const [timeElapsed, setTimeElapsed] = useState("00:00:00")

  useEffect(() => {
    const updateTimeElapsed = () => {
      // Update timer
      const start = moment(workoutStore.startTime)
      const duration = moment.duration(moment().diff(start))
      const formatted = formatDuration(duration)

      setTimeElapsed(formatted)

      // Check if rest time is active and update that as well
      if (workoutStore.restTimeRemaining > 0) {
        workoutStore.subtractRestTimeRemaining(1)
      }
    }

    const intervalId = setInterval(updateTimeElapsed, 1000)

    // Function called when component unmounts
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return timeElapsed
}
