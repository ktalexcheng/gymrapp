import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExerciseSettings } from "./exerciseModel"

export interface UserPreferences {
  allExerciseSettings?: {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[]
}

export interface WorkoutMeta {
  endTime: Date | FirebaseFirestoreTypes.Timestamp
}

export interface UnauthorizedUser {
  email: string
  firstName?: string
  lastName?: string
  privateAccount?: boolean
}

export interface User extends UnauthorizedUser {
  firstName: string
  lastName: string
  privateAccount: boolean
  userId: string
  providerId: string
  photoUrl?: string
  preferences?: UserPreferences
  workoutsMeta?: Record<string, WorkoutMeta>
}

export function isUser(value: unknown): value is User {
  return value && typeof value === "object" && (value as User).email !== undefined
}
