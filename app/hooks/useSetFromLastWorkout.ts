import { ExerciseId, WorkoutId } from "app/data/model"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

export const useSetFromLastWorkout = <T>(
  exerciseId: ExerciseId,
  setOrder: number,
): [setFromLastWorkout: T, lastWorkoutId: WorkoutId] => {
  const { userStore, feedStore } = useStores()
  const [lastWorkoutId, setLastWorkoutId] = useState<string | undefined>(undefined)
  const [setFromLastWorkout, setSetFromLastWorkout] = useState<T | undefined>(undefined)

  useEffect(() => {
    if (feedStore.isLoadingUserWorkouts) return

    // Set from previous workout
    const _lastWorkoutId = userStore.getExerciseLastWorkoutId(exerciseId)
    const _setFromLastWorkout =
      _lastWorkoutId && (feedStore.getSetFromWorkout(_lastWorkoutId, exerciseId, setOrder) as T)
    setLastWorkoutId(_lastWorkoutId)
    setSetFromLastWorkout(_setFromLastWorkout)
  }, [feedStore.isLoadingUserWorkouts])

  return [setFromLastWorkout, lastWorkoutId]
}
