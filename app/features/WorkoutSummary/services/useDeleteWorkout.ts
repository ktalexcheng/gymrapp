import { useMutation, useQueryClient } from "@tanstack/react-query"
import { rootStore } from "app/stores"
import { queries } from "./queryFactory"

const { feedStore } = rootStore

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => {
      return feedStore.deleteWorkout(workoutId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.getWorkout._def })
    },
  })
}
