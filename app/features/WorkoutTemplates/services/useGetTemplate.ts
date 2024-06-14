import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetTemplate = (workoutTemplateId?: string | null) => {
  return useQuery({ ...queries.get(workoutTemplateId!), enabled: !!workoutTemplateId })
}
