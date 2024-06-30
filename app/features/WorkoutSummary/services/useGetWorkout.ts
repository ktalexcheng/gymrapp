import { useFocusEffect } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { queries } from "./queryFactory"

export const useGetWorkout = (workoutId?: string) => {
  const query = useQuery({ ...queries.getWorkout({ workoutId: workoutId! }), enabled: !!workoutId })

  // In case the workout is updated, we want to refresh every time the screen is focused
  // For a more generic refetch on focus hook that can be shared for other queries, see:
  // https://gist.github.com/Luccasoli/9b4ec6fbe87a702d9e87a09fa0b38d59
  useFocusEffect(
    React.useCallback(() => {
      query.refetch()
    }, []),
  )

  return query
}
