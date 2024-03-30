import { MainStackScreenProps } from "app/navigators"
import React, { FC } from "react"
import { WorkoutEditor } from "../WorkoutEditor"

interface ActiveWorkoutScreenProps extends MainStackScreenProps<"ActiveWorkout"> {}

export const ActiveWorkoutScreen: FC<ActiveWorkoutScreenProps> = function ActiveWorkoutScreen() {
  return <WorkoutEditor mode="active" />
}
