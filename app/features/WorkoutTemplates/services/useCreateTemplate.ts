import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NewWorkoutTemplate, workoutTemplateRepository } from "app/data/repository"

import { queries } from "./queryFactory"

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: NewWorkoutTemplate) => {
      return workoutTemplateRepository.create(template)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.getAll._def })
    },
  })
}
