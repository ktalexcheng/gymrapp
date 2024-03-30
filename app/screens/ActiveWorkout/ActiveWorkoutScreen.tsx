import { useFocusEffect } from "@react-navigation/native"
import { MainStackScreenProps } from "app/navigators"
import { useStores } from "app/stores"
import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useEffect, useRef } from "react"
import { AppState } from "react-native"
import { WorkoutEditor } from "../WorkoutEditor"

interface ActiveWorkoutScreenProps extends MainStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = observer(
  function ActiveWorkoutScreen() {
    const { activeWorkoutStore } = useStores()
    const restTimeRunningRef = useRef(activeWorkoutStore.restTimeRunning)

    // For capturing current state in closure
    useEffect(() => {
      restTimeRunningRef.current = activeWorkoutStore.restTimeRunning
    }, [activeWorkoutStore.restTimeRunning]) // To trigger useEffect on restTimeRunning change

    // Dismiss stale rest timer notification when app is resumed from background
    useEffect(() => {
      const subscribeAppStateChange = AppState.addEventListener("change", (state) => {
        console.debug("ActiveWorkoutScreen AppState changed to", state)
        if (state === "active" && !restTimeRunningRef.current) {
          console.debug(
            "ActiveWorkoutScreen AppState.addEventListener: dismiss exercise rest notifications",
          )
          activeWorkoutStore.dismissRestNotifications()
        }
      })

      return () => subscribeAppStateChange.remove()
    }, [])

    // Dismiss stale rest timer notification when user navigates back to this screen
    // Set a 3 second delay to allow the notification to be displayed briefly
    useFocusEffect(
      useCallback(() => {
        console.debug("ActiveWorkoutScreen useFocusEffect triggered")
        if (!activeWorkoutStore.restTimeRunning) {
          console.debug("ActiveWorkoutScreen useFocusEffect: dismiss exercise rest notifications")
          const timeout = setTimeout(() => activeWorkoutStore.dismissRestNotifications(), 3000)
          return () => clearTimeout(timeout)
        }
        return undefined
      }, [activeWorkoutStore.restTimeRunning]),
    )

    return <WorkoutEditor mode="active" />
  },
)
