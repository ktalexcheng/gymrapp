import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NewWorkoutTemplate, workoutTemplateRepository } from "app/data/repository"

import { queries } from "./queryFactory"

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: NewWorkoutTemplate & { workoutTemplateId: string }) => {
      return workoutTemplateRepository.update(template.workoutTemplateId, template)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.getAll._def })
      queryClient.invalidateQueries({ queryKey: queries.get._def })
    },
  })
}
