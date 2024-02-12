import { User } from "app/data/types"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { Instance } from "mobx-state-tree"
import { IExerciseHistoryModel, IWorkoutMetaModel, UserModel } from "../UserStore"

export const convertUserToMSTModel = (user: User): Instance<typeof UserModel> => {
  const convertedUser = convertFirestoreTimestampToDate(user)

  // Handle workoutMetas
  if (convertedUser.workoutMetas) {
    const convertedWorkoutMetas = {}

    for (const [workoutId, workoutMeta] of Object.entries(
      convertedUser.workoutMetas as IWorkoutMetaModel[],
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
    console.debug("UserStore.convertUserToMSTModel: converting personalRecords")
    const convertedExerciseHistory = {}

    for (const [exerciseId, exerciseHistory] of Object.entries(
      convertedUser.exerciseHistory as IExerciseHistoryModel,
    )) {
      convertedExerciseHistory[exerciseId] = {
        exerciseId,
        performedWorkoutIds: exerciseHistory.performedWorkoutIds,
      }

      if (exerciseHistory.personalRecords) {
        const convertedPersonalRecords = {}
        for (const [reps, personalRecords] of Object.entries(exerciseHistory.personalRecords)) {
          convertedPersonalRecords[Number(reps)] = {
            reps: Number(reps),
            records: personalRecords,
          }
        }
        convertedExerciseHistory[exerciseId].personalRecords = convertedPersonalRecords
      }
    }

    console.debug("UserStore.convertUserToMSTModel: converting personalRecords", {
      convertedExerciseHistory,
    })
    convertedUser.exerciseHistory = convertedExerciseHistory
  }
  return UserModel.create(convertedUser)
}
