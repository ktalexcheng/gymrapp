import { DefaultUserPreferences } from "app/data/constants"
import { Gym, GymDetails, GymId } from "app/data/model"
import { translate } from "app/i18n"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { getNestedField } from "app/utils/getNestedField"
import { getTime, startOfWeek } from "date-fns"
import { LocationObject } from "expo-location"
import { flow, getEnv, types } from "mobx-state-tree"
import Toast from "react-native-root-toast"
import { ExerciseId, User, UserPreferences, Workout, isUser, isWorkout } from "../../app/data/model"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"

const UserType = createCustomType<User>("User", isUser)
const WorkoutType = createCustomType<Workout>("Workout", isWorkout)

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
    workouts: types.map(
      types.model({
        workoutId: types.identifier,
        workout: WorkoutType,
      }),
    ),
    isLoadingProfile: true,
    isLoadingWorkouts: true,
    isNewUser: true,
  })
  .views((self) => ({
    get profileIncomplete() {
      console.debug("UserStore.profileIncomplete called")
      // If store has not been initialized, we cannot reliably determine status
      // Return false to prevent flashing of the onboarding stack before store can be
      // initialized with user data
      if (self.isLoadingProfile) return false

      if (self.isNewUser) return true
      if (self.user === null || self.user === undefined) return true

      if (
        isEmptyField(self.user.firstName) ||
        isEmptyField(self.user.lastName) ||
        isEmptyField(self.user.privateAccount)
      ) {
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

      if (self.user.firstName && self.user.lastName) {
        return `${self.user.firstName} ${self.user.lastName}`
      }

      console.warn(
        "UserStore.displayName: User display name not available. Using email instead. This should not be possible.",
      )
      return self.user.email
    },
    get weeklyWorkoutsCount() {
      const workouts = Array.from(self.workouts.values())
      const weeklyWorkoutsCount = new Map<number, number>()
      workouts.forEach((w) => {
        // Find start of week (Monday)
        const weekStart = startOfWeek(w.workout.startTime, {
          weekStartsOn: 1,
        })
        const weekStartTime = getTime(weekStart)

        if (!weeklyWorkoutsCount.has(weekStartTime)) {
          weeklyWorkoutsCount.set(weekStartTime, 0)
        }

        weeklyWorkoutsCount.set(weekStartTime, weeklyWorkoutsCount.get(weekStartTime) + 1)
      })

      // console.debug(
      //   "UserStore.weeklyWorkoutsCount weekStartTime.keys():",
      //   ...weeklyWorkoutsCount.keys(),
      // )
      return weeklyWorkoutsCount
    },
  }))
  .actions((self) => ({
    invalidateSession: () => {
      self.userId = undefined
      self.user = undefined
      self.workouts.clear()
      self.isLoadingProfile = true
      self.isLoadingWorkouts = true
      self.isNewUser = true
    },
    uploadUserAvatar: flow<string, [imagePath: string]>(function* (imagePath: string) {
      try {
        const avatarUrl = yield getEnv<RootStoreDependencies>(self).userRepository.uploadAvatar(
          imagePath,
        )

        return avatarUrl
      } catch (e) {
        console.error("UserStore.uploadUserAvatar error:", e)
      }
    }),
    /**
     * Creating a profile should usually be done right after signing up
     * this is for the rare case when a user's profile needs to be recreated
     * e.g. when a user deletes their account and signs up again
     * e.g. for testing purposes
     */
    createNewProfile: flow(function* (newUser: User) {
      self.isLoadingProfile = true

      try {
        const { userRepository } = getEnv<RootStoreDependencies>(self)
        userRepository.setUserId(newUser.userId)
        yield userRepository.create(newUser)

        self.isLoadingProfile = false
        self.isNewUser = false
      } catch (e) {
        console.error("UserStore.createNewProfile error:", e)
      }
    }),
    getWorkouts: flow(function* () {
      console.debug("UserStore.getWorkouts called")
      try {
        self.isLoadingWorkouts = true

        if (!self.user?.workoutMetas) {
          self.isLoadingWorkouts = false
          return
        }

        const workoutIds = Object.keys(self.user.workoutMetas)
        const workouts: Workout[] = yield getEnv<RootStoreDependencies>(
          self,
        ).workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("UserStore.getWorkouts no workouts found")
          self.isLoadingWorkouts = false
          return
        }

        workouts.forEach((w) => {
          self.workouts.put({
            workoutId: w.workoutId,
            workout: w,
          })
        })

        self.isLoadingWorkouts = false
      } catch (e) {
        console.error("UserStore.getWorkouts error:", e)
      }
      console.debug("UserStore.getWorkouts done")
    }),
    getForeignUser: flow(function* (userId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const user = yield userRepository.get(userId, false)
      return user
    }),
    followUser: flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.followUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.followUser error:", e)
      }
    }),
    unfollowUser: flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.unfollowUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.unfollowUser error:", e)
      }
    }),
    isFollowingUser: flow(function* (followeeUserId: string) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const isFollowing = yield userRepository.isFollowingUser(followeeUserId)
      return isFollowing
    }),
    getUserLocation: flow(function* () {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      return yield userRepository.getUserLocation()
    }) as () => Promise<LocationObject>,
  }))
  .actions((self) => ({
    loadUserWithId: flow(function* (userId: string) {
      console.debug("UserStore.loadUserWIthId called:", userId)
      self.isLoadingProfile = true

      try {
        const { userRepository, privateExerciseRepository, feedRepository } =
          getEnv<RootStoreDependencies>(self)
        feedRepository.setCollectionPath(`feeds/${userId}/feedItems`)
        userRepository.setUserId(userId)
        privateExerciseRepository.setUserId(userId)

        const user = yield userRepository.get(userId, true)

        if (user) {
          console.debug("UserStore.loadUserWIthId user:", user)
          self.user = user
          self.isNewUser = false
          yield self.getWorkouts()
        } else {
          self.isNewUser = true
        }

        self.isLoadingProfile = false
      } catch (e) {
        console.error("UserStore.loadUserWIthId error:", e)
      }

      self.userId = userId
      console.debug("UserStore.loadUserWIthId done")
    }),
    setUser(user: User) {
      self.isLoadingProfile = true
      console.debug("UserStore.setUser user:", user)
      self.user = convertFirestoreTimestampToDate(user)
      self.getWorkouts()
      self.isLoadingProfile = false
    },
    updateProfile: flow(function* (userUpdate: Partial<User>) {
      console.debug("UserStore.updateProfile called")
      self.isLoadingProfile = true

      try {
        yield getEnv<RootStoreDependencies>(self).userRepository.update(null, userUpdate, true)
        self.user = { ...self.user, ...userUpdate }
        yield self.getWorkouts()

        self.isLoadingProfile = false
      } catch (e) {
        console.error("UserStore.updateProfile error:", e)
      }
      console.debug("UserStore.updateProfile done")
    }),
    deleteProfile: flow(function* () {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.delete(self.userId)
      } catch (e) {
        console.error("UserStore.deleteProfile error:", e)
      }
      self.invalidateSession()
    }),
    getProp<T>(propPath: string): T {
      const value = getNestedField(self, propPath) as T

      // Array and Map (object) must not be mutated, so we need to return a copy
      if (Array.isArray(value)) {
        console.debug("UserStore.getProp:", propPath, "value is array")
        return [...value] as T
      } else if (value instanceof Object) {
        // TODO: This seems to cause the app to hang
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
    getSetFromLastWorkout(exerciseId: ExerciseId, setOrder: number) {
      const exerciseHistory = getNestedField(
        self.user,
        "exerciseHistory",
      ) as User["exerciseHistory"]
      if (!exerciseHistory) return null

      const exerciseHistoryItem = exerciseHistory?.[exerciseId]
      if (!exerciseHistoryItem) return null

      const workoutsCount = exerciseHistoryItem.performedWorkoutIds.length
      const latestWorkoutId = exerciseHistoryItem.performedWorkoutIds[workoutsCount - 1]
      const latestWorkout = self.workouts.get(latestWorkoutId)
      const lastPerformedSet = latestWorkout.workout.exercises.filter(
        (e) => e.exerciseId === exerciseId,
      )[0].setsPerformed?.[setOrder]
      if (!lastPerformedSet) return null

      return lastPerformedSet
    },
    isInMyGyms(gymId: GymId) {
      return !!self.user?.myGyms?.find((myGym) => myGym.gymId === gymId)
    },
  }))
  .actions((self) => ({
    addToMyGyms: flow(function* (gym: GymDetails) {
      console.debug("UserStore.addToMyGyms called user:", self.user)
      if (self.isInMyGyms(gym.gymId)) {
        Toast.show(translate("gymDetailsScreen.alreadyAddedToMyGymsLabel"), {
          duration: Toast.durations.SHORT,
        })
        return
      }

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const updatedUser = yield userRepository.addToMyGyms(gym)
      self.user = updatedUser
    }),
    removeFromMyGyms: flow(function* (gym: Gym | GymDetails) {
      console.debug("UserStore.removeFromMyGyms called user:", self.user)
      if (!self.isInMyGyms(gym.gymId)) {
        Toast.show(translate("gymDetailsScreen.alreadyRemovedFromMyGymsLabel"), {
          duration: Toast.durations.SHORT,
        })
        return
      }

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const updatedUser = yield userRepository.removeFromMyGyms(gym)
      self.user = updatedUser
    }),
  }))
