import { ExerciseId, WorkoutId } from "app/data/types"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

export const useSetFromLastWorkout = <T>(
  exerciseId: ExerciseId,
  setOrder: number,
): [setFromLastWorkout: T | null, lastWorkoutId: WorkoutId | null] => {
  const { userStore, feedStore } = useStores()
  const [lastWorkoutId, setLastWorkoutId] = useState<string | null>(null)
  const [setFromLastWorkout, setSetFromLastWorkout] = useState<T | null>(null)

  useEffect(() => {
    if (feedStore.isLoadingUserWorkouts) return

    // Set from previous workout
    const _lastWorkoutId = userStore.getExerciseLastWorkoutId(exerciseId)
    const _setFromLastWorkout =
      _lastWorkoutId && (feedStore.getSetFromWorkout(_lastWorkoutId, exerciseId, setOrder) as T)

    if (_lastWorkoutId && _setFromLastWorkout) {
      setLastWorkoutId(_lastWorkoutId)
      setSetFromLastWorkout(_setFromLastWorkout)
    }
  }, [feedStore.isLoadingUserWorkouts])

  return [setFromLastWorkout, lastWorkoutId]
}
