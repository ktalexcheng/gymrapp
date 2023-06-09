import { NewExercisePerformed } from "./exerciseModel"

export interface NewWorkout {
  startTime: Date | number
  endTime: Date | number
  exercises: NewExercisePerformed[]
}

export interface Workout extends NewWorkout {
  workoutId: string
}
