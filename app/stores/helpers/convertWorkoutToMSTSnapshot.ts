import { NewExerciseRecord, Workout } from "app/data/types"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"

/**
 * Older versions of the workout document are missing some fields that are now required due to MST model changes.
 * This function converts the workout document to conform to the MST model.
 * @param workout
 * @returns
 */
export function convertWorkoutToMSTSnapshot(workout: Workout) {
  const convertedWorkout = convertFirestoreTimestampToDate(workout)

  for (const exercise of convertedWorkout.exercises) {
    if (!exercise.newRecords || Object.keys(exercise.newRecords).length === 0) {
      // console.debug("convertWorkoutToMSTSnapshot(): Skipping exercise without newRecords")
      continue
    }

    // Handle newRecords
    for (const [_, newRecord] of Object.entries(exercise.newRecords as NewExerciseRecord)) {
      if (newRecord.reps === undefined || newRecord.reps === null) {
        console.debug(
          "convertWorkoutToMSTSnapshot(): Setting newRecord.reps = 0 for old time based exercise",
          newRecord,
        )
        newRecord.reps = 0
      }
    }

    // Flag sets with isNewRecord = true if it is a new record
    for (const set of exercise.setsPerformed) {
      const newRecord = exercise?.newRecords?.[set.reps]
      if (newRecord && (newRecord.weight === set.weight || newRecord.time === set.time)) {
        set.isNewRecord = true
      }
    }
  }

  return {
    ...convertedWorkout,
  }
}
