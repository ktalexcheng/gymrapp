import { AppLocale, WeightUnit } from "../constants"
import { ExerciseId, ExerciseRecord, ExerciseSettings } from "./exerciseModel"
import { WorkoutId } from "./workoutModel"

export interface UserPreferences {
  appLocale: AppLocale
  weightUnit: WeightUnit
  autoRestTimerEnabled: boolean
  restTime: number
  exerciseSpecificSettings?: Record<ExerciseId, ExerciseSettings>
}

export interface WorkoutMeta {
  startTime: Date
}

export interface UnregisteredUser {
  email: string
  firstName?: string
  lastName?: string
  privateAccount?: boolean
}

export interface ExerciseHistory {
  performedWorkoutIds: WorkoutId[]
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
  workoutMetas?: Record<WorkoutId, WorkoutMeta>
  exerciseHistory?: Record<ExerciseId, ExerciseHistory>
}

export function isUser(value: unknown): value is User {
  return value && typeof value === "object" && (value as User).userId !== undefined
}
