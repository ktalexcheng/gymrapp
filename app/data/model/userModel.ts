import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"
import { ExerciseSettings } from "./exerciseModel"

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

export interface User extends UnregisteredUser {
  firstName: string
  lastName: string
  privateAccount: boolean
  userId: string
  providerId: string
  preferences: UserPreferences
  avatarUrl?: string
  workoutsMeta?: Record<string, WorkoutMeta>
}

export function isUser(value: unknown): value is User {
  return value && typeof value === "object" && (value as User).email !== undefined
}
