import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExercisePerformed } from "./exerciseModel"

export enum WorkoutVisibility {
  Private = "private",
  Public = "public",
}

// export interface WorkoutSummary {}

export interface NewWorkout {
  byUser: string
  visibility: string
  startTime: Date | FirebaseFirestoreTypes.Timestamp
  endTime: Date | FirebaseFirestoreTypes.Timestamp
  exercises: ExercisePerformed[]
  workoutTitle: string
}

export interface Workout extends NewWorkout {
  workoutId: string
  // summary: WorkoutSummary
}

export function isWorkout(value: unknown): value is Workout {
  return value && typeof value === "object" && (value as Workout).workoutId !== undefined
}
