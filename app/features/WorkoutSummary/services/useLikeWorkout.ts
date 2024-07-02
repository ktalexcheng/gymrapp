import { useMutation, useQueryClient } from "@tanstack/react-query"
import { WorkoutInteraction } from "app/data/types"
import { useStores } from "app/stores"
import { logError } from "app/utils/logger"
import { queries } from "./queryFactory"

export const useLikeWorkout = () => {
  const { feedStore } = useStores()
  const queryClient = useQueryClient()

  const likeWorkout = useMutation({
    mutationFn: (params: {
      workoutId: string
      likedByUserId: string
      action: "like" | "unlike"
    }) => {
      if (params.action === "unlike") {
        return feedStore.unlikeWorkout(params.workoutId, params.likedByUserId)
      }

      return feedStore.likeWorkout(params.workoutId, params.likedByUserId)
    },
    onMutate: async (params) => {
      const queryKey = queries.getWorkoutInteractions(params.workoutId).queryKey
      // Cancel any outgoing re-fetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const prevWorkoutInteraction = (queryClient.getQueryData(queryKey) ??
        []) as WorkoutInteraction

      // Optimistically update to the new value
      if (params.action === "unlike") {
        queryClient.setQueryData(queryKey, (prev: WorkoutInteraction) => ({
          ...prev,
          likedByUserIds: prev?.likedByUserIds?.filter((id) => id !== params.likedByUserId),
        }))
      } else {
        queryClient.setQueryData(queryKey, (prev: WorkoutInteraction) => ({
          ...prev,
          likedByUserIds: [...(prev?.likedByUserIds ?? []), params.likedByUserId],
        }))
      }

      // Return a context object with the snapshot value
      return { prevWorkoutInteraction }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      logError(err, "likeWorkout mutation failed", { variables, context })
      const queryKey = queries.getWorkoutInteractions(variables.workoutId).queryKey
      context && queryClient.setQueryData(queryKey, context.prevWorkoutInteraction)
    },
    // Always refetch after error or success:
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: queries.getWorkoutInteractions(variables.workoutId).queryKey,
      })
    },
  })

  return likeWorkout
}
