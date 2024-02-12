import { AppColorScheme, AppLocale, WeightUnit } from "../constants"
import { ExerciseId, ExerciseRecord, ExerciseSettings } from "./exercise.types"
import { Gym } from "./gym.types"
import { baseMetadata } from "./metadata.types"
import { WorkoutId } from "./workout.types"

export interface UserPreferences {
  appLocale: AppLocale
  weightUnit: WeightUnit
  autoRestTimerEnabled: boolean
  restTime: number
  exerciseSpecificSettings?: { [exerciseId: ExerciseId]: ExerciseSettings }
  appColorScheme?: AppColorScheme
}

export interface WorkoutMeta {
  startTime: Date
}

// export interface UnregisteredUser extends baseMetadata {
//   firstName: string
//   lastName: string
// }

export interface ExerciseHistory {
  performedWorkoutIds: WorkoutId[]
  personalRecords: ExerciseRecord
}

export type UserId = string

export interface User extends baseMetadata {
  userId: UserId
  userHandle: string
  _userHandleLower: string // internal use only, for case-insensitive search
  email: string
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
  userHandle: string
  firstName: string
  lastName: string
  avatarUrl?: string
}
