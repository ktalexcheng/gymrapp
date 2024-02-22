import crashlytics from "@react-native-firebase/crashlytics"
import { DefaultUserPreferences, UserErrorType } from "app/data/constants"
import {
  ExerciseId,
  FollowRequest,
  Gym,
  GymDetails,
  GymId,
  User,
  UserId,
  UserPreferences,
} from "app/data/types"
import { translate } from "app/i18n"
import { api } from "app/services/api"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatName } from "app/utils/formatName"
import { getNestedField } from "app/utils/getNestedField"
import { flow, getEnv, getSnapshot, types } from "mobx-state-tree"
import Toast from "react-native-root-toast"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { FollowRequestsModel, INotificationModel, NotificationModel, UserModel } from "./models"

function isEmptyField(value: any) {
  if (value === undefined || value === null || value === "") {
    return true
  }

  return false
}

export const UserStoreModel = types
  .model("UserStoreModel")
  .props({
    userId: types.maybeNull(types.string),
    user: types.maybe(UserModel),
    isLoadingProfile: true,
    notifications: types.maybe(types.array(NotificationModel)),
    followRequests: types.maybe(types.array(FollowRequestsModel)),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get profileIncomplete() {
      if (self.isLoadingProfile) return false

      if (
        !self.userId ||
        !self.user ||
        isEmptyField(self.user?.firstName) ||
        isEmptyField(self.user?.lastName) ||
        isEmptyField(self.user?.userHandle) ||
        isEmptyField(self.user?.privateAccount)
      ) {
        console.debug("UserStore.profileIncomplete returned true")
        return true
      }

      console.debug("UserStore.profileIncomplete return false")
      return false
    },
    get displayName() {
      if (!self.user) {
        console.warn("UserStore.displayName: User profile not available")
        return undefined
      }

      return formatName(self.user.firstName, self.user.lastName)
    },
    getExerciseLastWorkoutId(exerciseId: ExerciseId) {
      if (!self.user) return null

      const exerciseHistoryItem = self.user.exerciseHistory?.get(exerciseId)
      if (!exerciseHistoryItem) return null

      const workoutsCount = exerciseHistoryItem.performedWorkoutIds.length
      if (workoutsCount === 0) return null

      const lastWorkoutId = exerciseHistoryItem.performedWorkoutIds[workoutsCount - 1]
      return lastWorkoutId
    },
    getProp<T>(propPath: string): T {
      const value = getNestedField(getSnapshot(self), propPath) as T

      // Array and Map (object) must not be mutated, so we need to return a copy
      if (Array.isArray(value)) {
        console.debug("UserStore.getProp:", propPath, "value is array")
        return [...value] as T
      } else if (value instanceof Object) {
        console.debug("UserStore.getProp:", propPath, "value is object")
        return { ...value } as T
      }

      return value
    },
    getUserPreference<T>(pref: keyof UserPreferences): T {
      const prefPath = `preferences.${pref}`
      const prefValue = self.user && getNestedField(self.user, prefPath)
      // console.debug("UserStore.getUserPreference:", { pref, prefValue })
      if (!prefValue) {
        return DefaultUserPreferences[pref] as T
      }
      return prefValue as T
    },
    get newNotifications() {
      return self.notifications
        ?.filter((notification) => !notification.isRead)
        ?.sort((a, b) => b.notificationDate.getTime() - a.notificationDate.getTime())
    },
    get oldNotifications() {
      return self.notifications
        ?.filter((notification) => notification.isRead)
        ?.sort((a, b) => b.notificationDate.getTime() - a.notificationDate.getTime())
    },
    get pendingFollowRequests() {
      return self.followRequests
        ?.filter((followRequest) => !followRequest.isAccepted && !followRequest.isDeclined)
        ?.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
    },
    get newNotificationsCount() {
      const newNotifications = self.notifications?.filter((notification) => !notification.isRead)
      const pendingFollowRequests = self.followRequests?.filter((followRequest) => {
        return !followRequest.isAccepted && !followRequest.isDeclined
      })
      const newNotificationsCount =
        (newNotifications?.length ?? 0) + (pendingFollowRequests?.length ?? 0)
      console.debug("UserStore.newNotificationsCount:", newNotificationsCount)
      return newNotificationsCount
    },
  }))
  .actions((self) => {
    function invalidateSession() {
      self.userId = null
      self.user = undefined

      const { userRepository, privateExerciseRepository, feedRepository, notificationRepository } =
        getEnv<RootStoreDependencies>(self)
      feedRepository.setUserId(undefined)
      userRepository.setUserId(undefined)
      privateExerciseRepository.setUserId(undefined)
      notificationRepository.setUserId(undefined)
    }

    const uploadUserAvatar = flow<string, [imagePath: string]>(function* (imagePath: string) {
      try {
        const avatarUrl = yield getEnv<RootStoreDependencies>(self).userRepository.uploadAvatar(
          imagePath,
        )

        return avatarUrl
      } catch (e) {
        console.error("UserStore.uploadUserAvatar error:", e)
      }
    })

    /**
     * Creating a profile should usually be done right after signing up
     * this is in case when a user's profile needs to be recreated
     * e.g. when a user deletes their account and signs up again
     * e.g. for testing purposes
     */
    const createNewProfile = flow(function* (newUser: User) {
      self.isLoadingProfile = true

      try {
        const { userRepository } = getEnv<RootStoreDependencies>(self)
        userRepository.setUserId(newUser.userId)
        yield userRepository.create(newUser)
        yield loadUserWithId(newUser.userId)
      } catch (e) {
        console.error("UserStore.createNewProfile error:", e)
      } finally {
        self.isLoadingProfile = false
      }
    })

    const getOtherUser = flow(function* (userId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const user = yield userRepository.get(userId, true)
      return user
    })

    const followUser = flow(function* (followeeUserId: string) {
      // const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield api.requestFollowOtherUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.followUser error:", e)
      }
    })

    const unfollowUser = flow(function* (followeeUserId: string) {
      // const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield api.unfollowOtherUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.unfollowUser error:", e)
      }
    })

    const isFollowingUser = flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const isFollowing = yield userRepository.isFollowingUser(followeeUserId)
      return isFollowing
    })

    const isFollowRequested = flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const isFollowRequested = yield userRepository.isFollowRequested(followeeUserId)
      return isFollowRequested
    })

    const cancelFollowRequest = flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.cancelFollowRequest(followeeUserId)
      } catch (e) {
        console.error("UserStore.cancelFollowRequest error:", e)
      }
    })

    const declineFollowRequest = flow(function* (followRequestId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.declineFollowRequest(followRequestId)
      } catch (e) {
        console.error("UserStore.declineFollowRequest error:", e)
      }
    })

    const acceptFollowRequest = flow(function* (followRequestId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.acceptFollowRequest(followRequestId)
        yield api.acceptFollowRequest(followRequestId)
      } catch (e) {
        console.error("UserStore.acceptFollowRequest error:", e)
      }
    })

    const fetchUserProfile = flow(function* () {
      if (!self.userId) {
        console.error("UserStore.fetchUserProfile: No userId set")
        return
      }

      self.isLoadingProfile = true
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        const user = yield userRepository.get(self.userId, true)

        if (user) {
          setUserFromFirebase(user)
        }
      } catch (e) {
        console.error("UserStore.fetchUserProfile error:", e)
      } finally {
        self.isLoadingProfile = false
      }
    })

    const setRepositoryUserId = (userId: UserId) => {
      const { userRepository, privateExerciseRepository, feedRepository, notificationRepository } =
        getEnv<RootStoreDependencies>(self)
      feedRepository.setUserId(userId)
      userRepository.setUserId(userId)
      privateExerciseRepository.setUserId(userId)
      notificationRepository.setUserId(userId)
    }

    const loadUserWithId = flow(function* (userId: UserId) {
      console.debug("UserStore.loadUserWIthId called")
      self.isLoadingProfile = true

      try {
        self.userId = userId
        setRepositoryUserId(userId)
        yield fetchUserProfile()
        console.debug("UserStore.loadUserWIthId done")
      } catch (e) {
        console.error("UserStore.loadUserWIthId error:", e)
      } finally {
        self.isLoadingProfile = false
      }
    })

    function setUserFromFirebase(user: User) {
      self.isLoadingProfile = true

      try {
        if (!user) {
          console.warn("UserStore.setUserFromFirebase: Empty user received")
          invalidateSession()
        } else {
          self.userId = user.userId
          self.user = UserModel.create(user as any) // UserModel's preprocessor will convert the user to MST model
          setRepositoryUserId(user.userId)
        }
      } catch (e) {
        crashlytics().recordError(e as any)
        console.error("UserStore.setUserFromFirebase error:", e)
      } finally {
        self.isLoadingProfile = false
      }
    }

    const updateProfile = flow(function* (userUpdate: Partial<User>) {
      if (!self.userId) return

      console.debug("UserStore.updateProfile called")
      self.isLoadingProfile = true

      try {
        const updatedUser = yield getEnv<RootStoreDependencies>(self).userRepository.update(
          self.userId,
          userUpdate,
          true,
        )

        console.debug("UserStore.updateProfile new user:", updatedUser)
        setUserFromFirebase(updatedUser)
      } catch (e: any) {
        if (e?.cause === UserErrorType.UserHandleAlreadyTakenError) {
          self.isLoadingProfile = false
          return Promise.reject(e)
        }
        console.error("UserStore.updateProfile error:", e)
      } finally {
        self.isLoadingProfile = false
      }

      console.debug("UserStore.updateProfile done")
      return Promise.resolve()
    })

    const deleteProfile = flow(function* () {
      if (!self.userId) return

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.delete(self.userId)
        self.user = undefined
      } catch (e) {
        console.error("UserStore.deleteProfile error:", e)
      }
      invalidateSession()
    })

    function isInMyGyms(gymId: GymId) {
      return !!self.user?.myGyms?.find((myGym) => myGym.gymId === gymId)
    }

    const addToMyGyms = flow(function* (gym: GymDetails) {
      console.debug("UserStore.addToMyGyms called user:", self.user)
      if (isInMyGyms(gym.gymId)) {
        Toast.show(translate("gymDetailsScreen.alreadyAddedToMyGymsLabel"), {
          duration: Toast.durations.SHORT,
        })
        return
      }

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const updatedUser = yield userRepository.addToMyGyms(gym)
      setUserFromFirebase(updatedUser)
    })

    const removeFromMyGyms = flow(function* (gym: Gym | GymDetails) {
      console.debug("UserStore.removeFromMyGyms called user:", self.user)
      if (!isInMyGyms(gym.gymId)) {
        Toast.show(translate("gymDetailsScreen.alreadyRemovedFromMyGymsLabel"), {
          duration: Toast.durations.SHORT,
        })
        return
      }

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const updatedUser = yield userRepository.removeFromMyGyms(gym)
      setUserFromFirebase(updatedUser)
    })

    const setNotifications = (notifications: INotificationModel[]) => {
      self.notifications = convertFirestoreTimestampToDate(notifications)
      // const sorted = convertFirestoreTimestampToDate(notifications)
      // sorted.sort((a, b) => b.notificationDate.getTime() - a.notificationDate.getTime())
      // self.notifications = sorted
    }

    const setFollowRequests = (followRequests: FollowRequest[] | undefined) => {
      if (!followRequests) self.followRequests = undefined
      else self.followRequests = convertFirestoreTimestampToDate(followRequests)
      // const sorted = convertFirestoreTimestampToDate(followRequests)
      // sorted.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
      // self.followRequests = sorted
    }

    const loadNotifications = flow(function* () {
      const { notificationRepository, userRepository } = getEnv<RootStoreDependencies>(self)
      const notifications = yield notificationRepository.getMany(undefined, true)
      self.notifications = notifications

      const followRequests = yield userRepository.getFollowRequests()
      self.followRequests = followRequests
    })

    const markNotificationAsRead = flow(function* (notificationId: string) {
      const { notificationRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield notificationRepository.update(notificationId, { isRead: true })
      } catch (e) {
        console.error("UserStore.readNotification error:", e)
      }
    })

    const userHandleIsAvailable = flow(function* (userHandle: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        const isAvailable = yield userRepository.userHandleIsAvailable(userHandle)
        return isAvailable
      } catch (e) {
        console.error("UserStore.userHandleAvailable error:", e)
      }
    })

    return {
      invalidateSession,
      fetchUserProfile,
      loadUserWithId,
      setUserFromFirebase,
      updateProfile,
      deleteProfile,
      createNewProfile,
      uploadUserAvatar,
      getOtherUser,
      followUser,
      unfollowUser,
      isFollowingUser,
      isFollowRequested,
      cancelFollowRequest,
      declineFollowRequest,
      acceptFollowRequest,
      setNotifications,
      setFollowRequests,
      loadNotifications,
      markNotificationAsRead,
      isInMyGyms,
      addToMyGyms,
      removeFromMyGyms,
      userHandleIsAvailable,
    }
  })
