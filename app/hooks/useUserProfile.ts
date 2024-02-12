import { User, UserId } from "app/data/types"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

export const useUserProfile = (
  userId: UserId,
): [userProfile: User | null, isRefreshing: boolean, refreshUserProfile: () => void] => {
  const { userStore } = useStores()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshUserProfile = () => {
    setRefreshKey(refreshKey + 1)
  }

  useEffect(() => {
    const getUserProfile = async () => {
      setIsRefreshing(true)
      await userStore.getOtherUser(userId).then((user) => setUserProfile(user))
      setIsRefreshing(false)
    }

    getUserProfile()
  }, [refreshKey])

  return [userProfile, isRefreshing, refreshUserProfile]
}
