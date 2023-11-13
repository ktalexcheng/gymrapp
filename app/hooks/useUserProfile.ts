import { User, UserId } from "app/data/model"
import { useStores } from "app/stores"
import { useEffect, useState } from "react"

export const useUserProfile = (
  userId: UserId,
): [userProfile: User, isRefreshing: boolean, refreshUserProfile: () => void] => {
  const { userStore } = useStores()
  const [userProfile, setUserProfile] = useState<User>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshUserProfile = () => {
    setRefreshKey(refreshKey + 1)
  }

  useEffect(() => {
    const getUserProfile = async () => {
      setIsRefreshing(true)
      await userStore.getForeignUser(userId).then((user) => setUserProfile(user))
      setIsRefreshing(false)
    }

    getUserProfile()
  }, [refreshKey])

  return [userProfile, isRefreshing, refreshUserProfile]
}
