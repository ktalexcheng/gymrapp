import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExercisePerformed, NewExercisePerformed } from "./exerciseModel"

export interface NewWorkout {
  byUser: string
  privateUser: boolean
  startTime: Date | FirebaseFirestoreTypes.Timestamp
  endTime: Date | FirebaseFirestoreTypes.Timestamp
  exercises: NewExercisePerformed[]
  workoutTitle: string
}

export interface Workout extends NewWorkout {
  workoutId: string
  exercises: ExercisePerformed[]
}

export function isWorkout(value: unknown): value is Workout {
  return value && typeof value === "object" && (value as Workout).workoutId !== undefined
}
