import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ActivityId } from "./activityModel"
import { ExercisePerformed } from "./exerciseModel"
import { UserId } from "./userModel"

export type WorkoutId = string

export interface NewWorkout {
  byUser: UserId
  visibility: string
  startTime: Date | FirebaseFirestoreTypes.Timestamp
  endTime: Date | FirebaseFirestoreTypes.Timestamp
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
