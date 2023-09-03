import { ExerciseSetType, ExerciseSource, WeightUnit } from "../constants"

export interface ExerciseSet {
  setType: ExerciseSetType
  weight: number
  reps: number
  rpe: number
  isCompleted: boolean
}

// Using Weight and Reps type alias for clarity
export type WeightType = number
export type RepsType = number
export interface PersonalRecord {
  workoutId: string
  // exerciseId: string
  datePerformed: Date
  reps: RepsType
  weight: WeightType
}
export type ExerciseRecord = Record<RepsType, PersonalRecord[]>
export type NewExerciseRecord = Record<RepsType, PersonalRecord>

export type ExerciseId = string

export interface ExercisePerformed {
  exerciseId: ExerciseId
  exerciseOrder: number
  setsPerformed: ExerciseSet[]
  datePerformed: Date
  totalVolume: number // Store as kg, convert to user preferred unit as necessary
  totalReps: number
  maxWeightSet: ExerciseSet
  newRecords: NewExerciseRecord
  exerciseNotes: string
  // weightPr?: ExerciseSet
  // volumePr?: ExerciseSet
  // timeSpent: Duration
  // averageRestTime: Duration
}

export interface ExerciseSettings {
  autoRestTimerEnabled: boolean
  restTime: number // In seconds
  weightUnit: WeightUnit
}

export const DefaultExerciseSettings: ExerciseSettings = {
  autoRestTimerEnabled: true,
  restTime: 120,
  weightUnit: WeightUnit.kg,
}

export interface NewExercise {
  activityName: string
  exerciseCat1: string
  exerciseCat2: string
  exerciseName: string
}

export interface Exercise extends NewExercise {
  exerciseId: ExerciseId
  exerciseSource: ExerciseSource
  // exerciseSettings?: ExerciseSettings
  exerciseHistory?: ExercisePerformed[]
}
