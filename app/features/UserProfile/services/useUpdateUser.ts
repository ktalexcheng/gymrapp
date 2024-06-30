import { useMutation, useQueryClient } from "@tanstack/react-query"
import { repositorySingletons } from "app/data/repository"

import { User } from "app/data/types"
import { queries } from "./queryFactory"

const { userRepository } = repositorySingletons

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (user: Partial<User> & Required<{ userId: string }>) => {
      console.debug("useUpdateUser.mutationFn", { user })
      return userRepository.update(user.userId, user)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.getUser._def })
    },
    onError: (error) => {
      console.error("useUpdateUser.onError", { error })
    },
    onSettled: () => {
      console.debug("useUpdateUser.onSettled")
    },
  })
}
