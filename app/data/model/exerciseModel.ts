export enum ExerciseSetType {
  WarmUp = "WarmUp",
  Normal = "Normal",
  DropSet = "DropSet",
  Failure = "Failure",
}

export type ExerciseSet = {
  setType: ExerciseSetType
  weight: number
  reps: number
  rpe: number
  isCompleted: boolean
}

export interface NewExercisePerformed {
  exerciseId: string
  exerciseOrder: number
  setsPerformed: ExerciseSet[]
}

export interface ExercisePerformed extends NewExercisePerformed {
  datePerformed: Date
  totalVolume: number // Store as kg, convert to user preferred unit as necessary
  totalReps: number
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
