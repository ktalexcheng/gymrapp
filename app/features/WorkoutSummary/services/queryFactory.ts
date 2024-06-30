import { createQueryKeys } from "@lukemorales/query-key-factory"
import { WorkoutSource } from "app/data/constants"
import { repositorySingletons } from "app/data/repository"
import { api } from "app/services"
import { rootStore } from "app/stores"
import { logError } from "app/utils/logger"

const { feedStore } = rootStore
const { workoutRepository } = repositorySingletons

// We still add the fetched workout to FeedStore to keep the data in sync
// Plan is to migrate entirely to react-query in the future
async function getWorkoutFn(params: { workoutId: string; workoutSource?: WorkoutSource }) {
  // If workoutSource is not provided, we assume it is another user's workout
  let workout
  if (params.workoutSource === WorkoutSource.User) {
    try {
      workout = await workoutRepository.get(params.workoutId, true)
      feedStore.addWorkoutToStore(WorkoutSource.User, workout)
    } catch (e) {
      logError(e, "getWorkoutFn() failed to get workout through repository")
    }
  } else {
    try {
      workout = await api.getOtherUserWorkout(params.workoutId)
      feedStore.addWorkoutToStore(WorkoutSource.OtherUser, workout)
    } catch (e) {
      logError(e, "getWorkoutFn() failed to get workout through API")
    }
  }

  return workout
}

async function getWorkoutInteractionsFn(workoutId: string) {
  return feedStore.getInteractionsForWorkout(workoutId)
}

export const queries = createQueryKeys("workout", {
  getWorkout: (params: { workoutId: string; workoutSource?: WorkoutSource }) => ({
    queryKey: [params.workoutId],
    queryFn: () => {
      return getWorkoutFn(params)
    },
  }),
  getWorkoutInteractions: (workoutId: string) => ({
    queryKey: [workoutId],
    queryFn: () => {
      return getWorkoutInteractionsFn(workoutId)
    },
  }),
})
