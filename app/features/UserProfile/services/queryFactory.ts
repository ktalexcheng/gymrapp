import { createQueryKeys } from "@lukemorales/query-key-factory"
import { repositorySingletons } from "app/data/repository"
import { rootStore } from "app/stores"

const { feedStore } = rootStore
const { userRepository } = repositorySingletons

export const queries = createQueryKeys("users", {
  getUser: (userId) => ({
    queryKey: [userId],
    queryFn: () => feedStore.fetchUserProfileToStore(userId),
  }),
  getFollowRequests: () => ({
    queryKey: ["followRequests"],
    queryFn: () => userRepository.getFollowRequests(),
  }),
})
