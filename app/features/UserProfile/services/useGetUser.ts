import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetUser = (userId?: string) => {
  return useQuery({ ...queries.getUser(userId), enabled: !!userId })
}
