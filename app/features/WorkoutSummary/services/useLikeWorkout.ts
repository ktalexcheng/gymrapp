import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useStores } from "app/stores"
import { queries } from "./queryFactory"

export const useLikeWorkout = () => {
  const { feedStore } = useStores()
  const queryClient = useQueryClient()

  const likeWorkout = useMutation({
    mutationFn: (params: { workoutId: string; likedByUserId: string }) => {
      return feedStore.likeWorkout(params.workoutId, params.likedByUserId)
    },
    onSuccess: (_, variables) => {
      console.debug("likeWorkout mutation success", {
        variables,
        queryKey: queries.getWorkoutInteractions(variables.workoutId).queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: queries.getWorkoutInteractions(variables.workoutId).queryKey,
      })
    },
  })

  const unlikeWorkout = useMutation({
    mutationFn: (params: { workoutId: string; byUserId: string }) => {
      return feedStore.unlikeWorkout(params.workoutId, params.byUserId)
    },
    onSuccess: (_, variables) => {
      console.debug("likeWorkout unlikeWorkout success", {
        variables,
        queryKey: queries.getWorkoutInteractions(variables.workoutId).queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: queries.getWorkoutInteractions(variables.workoutId).queryKey,
      })
    },
  })

  return { likeWorkout, unlikeWorkout }
}
