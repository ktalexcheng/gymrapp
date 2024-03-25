import { ExerciseSetType, ExerciseSource, ExerciseVolumeType, WeightUnit } from "../constants"
import { WorkoutId } from "./workout.types"

// ExerciseSet type specific to each ExerciseVolumeType
interface BaseExerciseSetPerformed {
  setType: ExerciseSetType
  isCompleted: boolean
}
export interface RepsExerciseSetPerformed extends BaseExerciseSetPerformed {
  volumeType: ExerciseVolumeType.Reps
  weight?: number
  reps: number
  rpe?: number
}
export interface TimeExerciseSetPerformed extends BaseExerciseSetPerformed {
  volumeType: ExerciseVolumeType.Time
  time: number
}
export type ExerciseSetPerformed = RepsExerciseSetPerformed | TimeExerciseSetPerformed

// PersonalRecord type specifici to each ExerciseVolumeType
// Using Weight and Reps type alias for clarity
export type Weight = number
export type Reps = number
interface BasePersonalRecord {
  workoutId?: WorkoutId // This will not be available when the summary is generated, only after the workout is saved
  datePerformed: Date
  reps: Reps
}
export interface RepsPersonalRecord extends BasePersonalRecord {
  volumeType: ExerciseVolumeType.Reps
  weight?: Weight | null // Weight could be 0 or null
}
export interface TimePersonalRecord extends BasePersonalRecord {
  volumeType: ExerciseVolumeType.Time
  time: number
}
export type PersonalRecord = RepsPersonalRecord | TimePersonalRecord

// ExerciseRecord stores user's personal records for each rep range
export type ExerciseRecord = Record<Reps, PersonalRecord[]>
// NewExerciseRecord stores a new record achieved in a workout
export type NewExerciseRecord = Record<Reps, PersonalRecord>

// Exercise types specific to each ExerciseVolumeType
export type ExerciseId = string
interface BaseExercisePerformed {
  exerciseId: ExerciseId
  exerciseSource: ExerciseSource
  exerciseName: string // If the exercise is private from another user, it won't be in the target user's exercise list, so we need to store this to display exercise summary
  exerciseOrder: number
  setsPerformed: ExerciseSetPerformed[]
  datePerformed: Date
  bestSet: ExerciseSetPerformed
  newRecords: NewExerciseRecord
  exerciseNotes?: string | null
}
export interface RepsExercisePerformed extends BaseExercisePerformed {
  volumeType: ExerciseVolumeType.Reps
  totalVolume: number
  totalReps: number
}
export interface TimeExercisePerformed extends BaseExercisePerformed {
  volumeType: ExerciseVolumeType.Time
  totalTime: number
}
export type ExercisePerformed = RepsExercisePerformed | TimeExercisePerformed

// Other exercise related types
export interface ExerciseSettings {
  autoRestTimerEnabled?: boolean
  restTime?: number // In seconds
  weightUnit?: WeightUnit
}

export interface NewExercise {
  activityName: string
  exerciseCat1: string
  exerciseCat2: string
  exerciseName: string
  volumeType: ExerciseVolumeType
}

export interface Exercise extends NewExercise {
  exerciseId: ExerciseId
  exerciseSource: ExerciseSource
  hasLeaderboard: boolean
  exerciseHistory?: ExercisePerformed[]
}
