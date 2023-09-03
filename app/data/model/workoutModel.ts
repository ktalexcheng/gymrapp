import { ActivityId } from "./activityModel"
import { ExercisePerformed } from "./exerciseModel"
import { UserId } from "./userModel"

export type WorkoutId = string

export interface NewWorkout {
  byUserId: UserId
  visibility: string
  startTime: Date
  endTime: Date
  exercises: ExercisePerformed[]
  workoutTitle: string
  activityId: ActivityId
}

export interface Workout extends NewWorkout {
  workoutId: WorkoutId
}

export function isWorkout(value: unknown): value is Workout {
  return value && typeof value === "object" && (value as Workout).workoutId !== undefined
}
