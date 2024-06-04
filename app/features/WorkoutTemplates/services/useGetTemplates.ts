import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetTemplates = (userId: string) => {
  return useQuery(queries.getAll(userId))
}
