import { ExerciseHistory, PersonalRecord, User, WorkoutMeta } from "app/data/types"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"

/**
 * User document's exerciseHistory.{exerciseId}.personalRecords is a map of
 * reps to personal records, which is an array of all the new personal records achieved.
 * In the MST model, we need to make sure the "reps" field is always present in
 * each element of the personal records array, it will be 0 for time based exercises.
 * @param personalRecordsMap
 * @returns
 */
const convertPersonalRecordsToMSTSnapshot = (
  personalRecordsMap: Record<number, PersonalRecord[]>,
) => {
  // console.debug("convertPersonalRecordsToMSTInterface(): Converting personalRecords")
  const convertedPersonalRecords = {}

  for (const [reps, personalRecords] of Object.entries(personalRecordsMap)) {
    // console.debug("convertPersonalRecordsToMSTInterface() personalRecords: ", personalRecords)
    for (const personalRecord of personalRecords) {
      if (personalRecord.reps === undefined || personalRecord.reps === null) {
        console.debug(
          "convertPersonalRecordsToMSTInterface(): Setting personalRecords.reps = 0 for old time based exercise",
        )
        personalRecord.reps = 0
      }
    }

    convertedPersonalRecords[Number(reps)] = {
      reps: Number(reps),
      records: personalRecords,
    }
  }

  return convertedPersonalRecords
}

/**
 * MST model has a specific structure for maps, where the key must also be present in the value object.
 * This functions converts the map fields in user document to conform to the MST model.
 * @param user
 * @returns
 */
export const convertUserToMSTSnapshot = (user: User) => {
  const convertedUser = convertFirestoreTimestampToDate(user)

  // Handle workoutMetas
  if (convertedUser.workoutMetas) {
    // console.debug("convertUserToMSTModel(): Converting workoutMetas")
    const convertedWorkoutMetas = {}

    for (const [workoutId, workoutMeta] of Object.entries(
      convertedUser.workoutMetas as Record<string, WorkoutMeta>,
    )) {
      convertedWorkoutMetas[workoutId] = {
        workoutId,
        startTime: new Date(workoutMeta.startTime),
      }
    }

    convertedUser.workoutMetas = convertedWorkoutMetas
  }

  // Handle personalRecords
  if (convertedUser.exerciseHistory) {
    // console.debug("convertUserToMSTModel(): Converting exerciseHistory")
    const convertedExerciseHistory = {}

    for (const [exerciseId, exerciseHistory] of Object.entries(
      convertedUser.exerciseHistory as Record<string, ExerciseHistory>,
    )) {
      convertedExerciseHistory[exerciseId] = {
        exerciseId,
        performedWorkoutIds: exerciseHistory.performedWorkoutIds,
      }

      if (exerciseHistory.personalRecords) {
        const convertedPersonalRecords = convertPersonalRecordsToMSTSnapshot(
          exerciseHistory.personalRecords,
        )
        convertedExerciseHistory[exerciseId].personalRecords = convertedPersonalRecords
      }
    }

    convertedUser.exerciseHistory = convertedExerciseHistory
  }

  return convertedUser
}
