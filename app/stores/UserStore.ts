import { DefaultUserPreferences, UserErrorType } from "app/data/constants"
import {
  FollowRequest,
  Gym,
  GymDetails,
  GymId,
  Notification,
  NotificationType,
} from "app/data/model"
import { translate } from "app/i18n"
import { api } from "app/services/api"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { formatName } from "app/utils/formatName"
import { getNestedField } from "app/utils/getNestedField"
import { flow, getEnv, types } from "mobx-state-tree"
import Toast from "react-native-root-toast"
import { ExerciseId, User, UserPreferences, isUser } from "../../app/data/model"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"

const UserType = createCustomType<User>("User", isUser)
// const WorkoutType = createCustomType<Workout>("Workout", isWorkout)
const NotificationModel = types.model({
  notificationId: types.identifier,
  notificationDate: types.Date,
  isRead: types.boolean,
  senderUserId: types.string,
  notificationType: types.enumeration(Object.values(NotificationType)),
  workoutId: types.maybe(types.string),
})
const FollowRequestsModel = types.model({
  requestId: types.identifier,
  requestedByUserId: types.string,
  requestDate: types.Date,
  isAccepted: types.boolean,
  isDeclined: types.boolean,
})

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
    user: UserType,
    isLoadingProfile: true,
    notifications: types.maybe(types.array(NotificationModel)),
    followRequests: types.maybe(types.array(FollowRequestsModel)),
  })
  .views((self) => ({
    get profileIncomplete() {
      if (
        self.user === null ||
        self.user === undefined ||
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
    get userProfileExists() {
      if (!self.user) return false

      return true
    },
    get displayName() {
      if (!self.user) {
        console.warn("UserStore.displayName: User profile not available")
        return undefined
      }

      return formatName(self.user.firstName, self.user.lastName)
    },
    getExerciseLastWorkoutId(exerciseId: ExerciseId) {
      const exerciseHistory = getNestedField(
        self.user,
        "exerciseHistory",
      ) as User["exerciseHistory"]
      if (!exerciseHistory) return null

      const exerciseHistoryItem = exerciseHistory?.[exerciseId]
      if (!exerciseHistoryItem) return null

      const workoutsCount = exerciseHistoryItem.performedWorkoutIds.length
      const lastWorkoutId = exerciseHistoryItem.performedWorkoutIds[workoutsCount - 1]

      return lastWorkoutId
    },
    getProp<T>(propPath: string): T {
      const value = getNestedField(self, propPath) as T

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
      const prefValue = getNestedField(self.user, prefPath)
      if (prefValue === undefined) {
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
      self.userId = undefined
      self.user = undefined
      // self.workouts.clear()
      self.isLoadingProfile = true
      // self.isLoadingWorkouts = true
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

        self.isLoadingProfile = false
      } catch (e) {
        console.error("UserStore.createNewProfile error:", e)
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

    // const getUserLocation = flow(function* () {
    //   const { userRepository } = getEnv<RootStoreDependencies>(self)
    //   return yield userRepository.getUserLocation()
    // }) as () => Promise<LocationObject>

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
          // console.debug("UserStore.loadUserWIthId user:", user)
          self.user = user
          // yield self.getWorkouts()
        }
      } catch (e) {
        console.error("UserStore.fetchUserProfile error:", e)
      } finally {
        self.isLoadingProfile = false
      }
    })

    const loadUserWithId = flow(function* (userId: string) {
      console.debug("UserStore.loadUserWIthId called:", userId)
      try {
        const {
          userRepository,
          privateExerciseRepository,
          feedRepository,
          notificationRepository,
        } = getEnv<RootStoreDependencies>(self)
        feedRepository.setUserId(userId)
        userRepository.setUserId(userId)
        privateExerciseRepository.setUserId(userId)
        notificationRepository.setUserId(userId)
        self.userId = userId
        yield fetchUserProfile()
      } catch (e) {
        console.error("UserStore.loadUserWIthId error:", e)
      }
      console.debug("UserStore.loadUserWIthId done")
    })

    function setUser(user: User) {
      self.isLoadingProfile = true
      console.debug("UserStore.setUser user:", user)
      self.user = convertFirestoreTimestampToDate(user)
      // self.getWorkouts()
      self.isLoadingProfile = false
    }

    const updateProfile = flow(function* (userUpdate: Partial<User>) {
      console.debug("UserStore.updateProfile called")
      self.isLoadingProfile = true

      try {
        let userHandleTakenError: Error
        const updatedUser = yield getEnv<RootStoreDependencies>(self)
          .userRepository.update(null, userUpdate, true)
          .then(undefined, (e: Error) => {
            if (e.cause === UserErrorType.UserHandleAlreadyTakenError) userHandleTakenError = e
            else throw e
          })

        if (userHandleTakenError) {
          return Promise.reject(userHandleTakenError)
        } else {
          console.debug("UserStore.updateProfile new user:", updatedUser)
          self.user = updatedUser
        }
      } catch (e) {
        console.error("UserStore.updateProfile error:", e)
      } finally {
        self.isLoadingProfile = false
      }

      console.debug("UserStore.updateProfile done")
      return Promise.resolve()
    })

    const deleteProfile = flow(function* () {
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
      self.user = updatedUser
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
      self.user = updatedUser
    })

    const setNotifications = (notifications: Notification[]) => {
      self.notifications = convertFirestoreTimestampToDate(notifications)
      // const sorted = convertFirestoreTimestampToDate(notifications)
      // sorted.sort((a, b) => b.notificationDate.getTime() - a.notificationDate.getTime())
      // self.notifications = sorted
    }

    const setFollowRequests = (followRequests: FollowRequest[]) => {
      self.followRequests = convertFirestoreTimestampToDate(followRequests)
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
      setUser,
      updateProfile,
      deleteProfile,
      createNewProfile,
      uploadUserAvatar,
      // getUserLocation,
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
