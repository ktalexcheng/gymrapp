import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetFollowRequests = () => {
  return useQuery({ ...queries.getFollowRequests() })
}
