import { AppLocale, WeightUnit } from "../constants"
import { baseMetadata } from "./baseModel"
import { ExerciseId, ExerciseRecord, ExerciseSettings } from "./exerciseModel"
import { Gym } from "./gymModel"
import { WorkoutId } from "./workoutModel"

export interface UserPreferences {
  appLocale: AppLocale
  weightUnit: WeightUnit
  autoRestTimerEnabled: boolean
  restTime: number
  exerciseSpecificSettings?: Map<ExerciseId, ExerciseSettings>
}

export interface WorkoutMeta {
  startTime: Date
}

export interface UnregisteredUser extends baseMetadata {
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
  userId: UserId
  firstName: string
  lastName: string
  myGyms: Gym[]
  privateAccount: boolean
  providerId: string
  preferences: UserPreferences
  avatarUrl?: string
  workoutMetas?: Record<WorkoutId, WorkoutMeta>
  exerciseHistory?: Record<ExerciseId, ExerciseHistory>
  followersCount?: number
  followingCount?: number
}

export interface UserSearchResult {
  userId: UserId
  firstName: string
  lastName: string
  avatarUrl?: string
}

export function isUser(value: any): value is User {
  if (typeof value !== "object") return false
  return (value as User).userId !== undefined
}
