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

export interface ExercisePerformed {
  exerciseId: string
  exerciseOrder: number
  setsPerformed: ExerciseSet[]
  datePerformed: Date | FirebaseFirestoreTypes.Timestamp
  totalVolume: number // Store as kg, convert to user preferred unit as necessary
  totalReps: number
  bestSet: ExerciseSet
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
  exerciseType: string
  exerciseSubtype: string
  exerciseCategory: string
  exerciseName: string
}

export interface Exercise extends NewExercise {
  exerciseId: string
  exerciseSource: "Public" | "Private"
  exerciseSettings?: ExerciseSettings
  exerciseHistory?: ExercisePerformed[]
}
