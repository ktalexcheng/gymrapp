import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { AppLanguage, WeightUnit } from "../constants"
import { ExerciseRecord, ExerciseSettings } from "./exerciseModel"

export interface UserPreferences {
  appLocale: AppLanguage
  allExerciseSettings?: {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[]
  weightUnit: WeightUnit
}

export interface WorkoutMeta {
  endTime: Date | FirebaseFirestoreTypes.Timestamp
}

export interface UnregisteredUser {
  email: string
  firstName?: string
  lastName?: string
  privateAccount?: boolean
}

export interface ExerciseHistory {
  performedWorkouts: string[]
  personalRecords: ExerciseRecord
}

export type UserId = string

export interface User extends UnregisteredUser {
  firstName: string
  lastName: string
  privateAccount: boolean
  userId: UserId
  providerId: string
  preferences: UserPreferences
  avatarUrl?: string
  workoutMetas?: Record<string, WorkoutMeta>
  exerciseHistory: Record<string, ExerciseHistory>
  // exerciseRecords: Record<string, ExerciseRecord>
}

export function isUser(value: unknown): value is User {
  return value && typeof value === "object" && (value as User).email !== undefined
}
