import { useMutation, useQueryClient } from "@tanstack/react-query"
import { workoutTemplateRepository } from "app/data/repository"

import { queries } from "./queryFactory"

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) => {
      return workoutTemplateRepository.delete(templateId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.getAll._def })
      queryClient.invalidateQueries({ queryKey: queries.get._def })
    },
  })
}
