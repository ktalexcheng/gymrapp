import { useQuery } from "@tanstack/react-query"
import { queries } from "./queryFactory"

export const useGetWorkoutInteractions = (workoutId: string) => {
  const query = useQuery({ ...queries.getWorkoutInteractions(workoutId) })
  return query
}
