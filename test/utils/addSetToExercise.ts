import { ExerciseSetPerformed } from "app/data/types"
import { WorkoutStoreModel } from "app/stores"
import { Instance } from "mobx-state-tree"

export const addSetToExercise = (
  workoutStore: Instance<typeof WorkoutStoreModel>,
  exerciseIndex: number,
  setPerformed: ExerciseSetPerformed,
) => {
  workoutStore.addSet(exerciseIndex)
  const setIndex = workoutStore.exercises.at(exerciseIndex)!.setsPerformed.length - 1

  for (const [key, value] of Object.entries(setPerformed)) {
    workoutStore.exercises
      .at(exerciseIndex)!
      .setsPerformed.at(setIndex)
      ?.setProp(key as any, value)
  }
}
