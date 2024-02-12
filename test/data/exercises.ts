import { ExerciseSource, ExerciseVolumeType } from "app/data/constants"
import { IExerciseModel } from "app/stores"

export const exercises: { [id: string]: IExerciseModel } = {
  testExercise1: {
    activityName: "Test Activity",
    exerciseId: "testExercise1",
    exerciseCat1: "Test Cat 1",
    exerciseName: "Test Exercise 1",
    exerciseSource: ExerciseSource.Public,
    volumeType: ExerciseVolumeType.Reps,
    hasLeaderboard: false,
  },
  testExercise2: {
    activityName: "Test Activity",
    exerciseId: "testExercise2",
    exerciseCat1: "Test Cat 2",
    exerciseName: "Test Exercise 2",
    exerciseSource: ExerciseSource.Public,
    volumeType: ExerciseVolumeType.Reps,
    hasLeaderboard: false,
  },
}
