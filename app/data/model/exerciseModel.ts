export enum ExerciseSetType {
  WarmUp,
  Normal,
  DropSet,
  Failure,
}

export type ExerciseSet = {
  setType: ExerciseSetType
  weight: number
  reps: number
  rpe: number
}

export type ExercisePerformed = {
  datePerformed: Date
  totalVolume: number // Store as kg, convert to user preferred unit as necessary
  totalReps: number
  setsPerformed: ExerciseSet[]
}

export type ExerciseSettings = {
  autoRestTimerEnabled: boolean
  restTime: number // In seconds
}

export type Exercise = {
  exerciseSource: "Public" | "Private"
  exerciseId: string
  exerciseType: string
  exerciseCategory: string
  exerciseName: string
  exerciseSettings?: ExerciseSettings
  exerciseHistory?: ExercisePerformed[]
}
