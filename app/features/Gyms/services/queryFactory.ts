import { createQueryKeys } from "@lukemorales/query-key-factory"
import { rootStore } from "app/stores"

const { feedStore, gymStore } = rootStore

const getGymMember = async (gymId: string, userId: string) => {
  const user = await feedStore.fetchUserProfileToStore(userId)
  const gymMember = await gymStore.getGymMember(gymId, userId)
  return {
    ...gymMember,
    ...user,
  }
}

export const queries = createQueryKeys("gyms", {
  getMember: (gymId: string, userId: string) => ({
    queryKey: [gymId, userId],
    queryFn: () => getGymMember(gymId, userId),
  }),
})
