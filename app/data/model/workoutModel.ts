import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExercisePerformed } from "./exerciseModel"

export enum WorkoutVisibility {
  Private = "private",
  Public = "public",
}

export interface NewWorkout {
  byUser: string
  visibility: string
  startTime: Date | FirebaseFirestoreTypes.Timestamp
  endTime: Date | FirebaseFirestoreTypes.Timestamp
  exercises: ExercisePerformed[]
  workoutTitle: string
  activityId: string
}

export interface Workout extends NewWorkout {
  workoutId: string
}

export function isWorkout(value: unknown): value is Workout {
  return value && typeof value === "object" && (value as Workout).workoutId !== undefined
}
