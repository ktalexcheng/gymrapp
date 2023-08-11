import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExerciseRecord, ExerciseSettings } from "./exerciseModel"

export enum AppLanguage {
  en_US = "en-US",
  zh_TW = "zh-TW",
}

export interface UserPreferences {
  appLocale: AppLanguage
  allExerciseSettings?: {
    exerciseId: string
    exerciseSettings: ExerciseSettings
  }[]
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

export interface User extends UnregisteredUser {
  firstName: string
  lastName: string
  privateAccount: boolean
  userId: string
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
