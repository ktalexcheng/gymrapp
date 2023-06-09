import { ExerciseSettings } from "./exerciseModel"

export interface UserPreferences {
  allExerciseSettings?: {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[]
}

export type WorkoutMetadata = Record<
  string,
  {
    endTime: Date
  }
>

export interface User {
  userId?: string
  email: string
  firstName?: string
  lastName?: string
  providerId?: string
  photoUrl?: string
  preferences?: UserPreferences
  workouts?: WorkoutMetadata
}

export function isUser(value: unknown): value is User {
  return value && typeof value === "object" && (value as User).email !== undefined
}
