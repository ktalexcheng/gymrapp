import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetTemplate = (workoutTemplateId: string) => {
  return useQuery(queries.get(workoutTemplateId))
}
