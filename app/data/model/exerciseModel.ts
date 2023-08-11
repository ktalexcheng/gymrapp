import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore"

export enum ExerciseSetType {
  WarmUp = "warmup",
  Normal = "normal",
  DropSet = "dropset",
  Failure = "failure",
}

export type ExerciseSet = {
  setType: ExerciseSetType
  weight: number
  reps: number
  rpe: number
  isCompleted: boolean
}

// Using Weight and Reps type alias for clarity
export type Weight = number
export type Reps = number
export type PersonalRecord = {
  workoutId: string
  // exerciseId: string
  datePerformed: Date | FirebaseFirestoreTypes.Timestamp
  reps: Reps
  weight: Weight
}
export type ExerciseRecord = Record<Reps, PersonalRecord[]>
export type NewExerciseRecord = Record<Reps, PersonalRecord>

export interface ExercisePerformed {
  exerciseId: string
  exerciseOrder: number
  setsPerformed: ExerciseSet[]
  datePerformed: Date | FirebaseFirestoreTypes.Timestamp
  totalVolume: number // Store as kg, convert to user preferred unit as necessary
  totalReps: number
  maxWeightSet: ExerciseSet
  newRecords: NewExerciseRecord
  // weightPr?: ExerciseSet
  // volumePr?: ExerciseSet
  // timeSpent: Duration
  // averageRestTime: Duration
}

export type ExerciseSettings = {
  autoRestTimerEnabled: boolean
  restTime: number // In seconds
}

export interface NewExercise {
  activityName: string
  exerciseCat1: string
  exerciseCat2: string
  exerciseName: string
}

export interface Exercise extends NewExercise {
  exerciseId: string
  exerciseSource: "Public" | "Private"
  // exerciseSettings?: ExerciseSettings
  exerciseHistory?: ExercisePerformed[]
}
