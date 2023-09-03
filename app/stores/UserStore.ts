import { getTime, startOfWeek } from "date-fns"
import { flow, getEnv, types } from "mobx-state-tree"
import { User, Workout, isUser, isWorkout } from "../../app/data/model"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"

const UserType = createCustomType<User>("User", isUser)
export const WorkoutType = createCustomType<Workout>("Workout", isWorkout)

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
    isInitializing: true,
    isLoadingProfile: true,
    isLoadingWorkouts: true,
    isNewUser: true,
  })
  .views((self) => ({
    get profileIncomplete() {
      console.debug("UserStore.profileIncomplete called")
      // If store has not been initialized, we cannot reliably determine status
      // Return true to prevent flashing of the onboarding stack before store can be
      // initialized with user data
      if (self.isInitializing) return false

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
    get isPrivate() {
      if (!self.user) {
        console.warn("UserStore.isPrivate: User profile not available")
        return undefined
      }

      return !!self.user.privateAccount
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

      console.debug(
        "UserStore.weeklyWorkoutsCount weekStartTime.keys():",
        ...weeklyWorkoutsCount.keys(),
      )
      return weeklyWorkoutsCount
    },
  }))
  .actions((self) => ({
    uploadUserAvatar: flow<string, [imagePath: string]>(function* (imagePath: string) {
      try {
        const avatarUrl = yield getEnv<RootStoreDependencies>(
          self,
        ).privateUserRepository.uploadAvatar(imagePath)

        return avatarUrl
      } catch (e) {
        console.error("UserStore.uploadUserAvatar error:", e)
      }
    }),
    /**
     * Creating a profile should usually be done right after signing up
     * this is for the rare case when a user's profile needs to be recreated
     */
    createNewProfile: flow(function* (newUser: User) {
      self.isLoadingProfile = true

      try {
        yield getEnv<RootStoreDependencies>(self).privateUserRepository.create(newUser)
        self.user = newUser

        self.isLoadingProfile = false
        self.isInitializing = false
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
    followUser: flow(function* (followeeUserId: string) {
      const { privateUserRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield privateUserRepository.followUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.followUser error:", e)
      }
    }),
    unfollowUser: flow(function* (followeeUserId: string) {
      const { privateUserRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield privateUserRepository.unfollowUser(followeeUserId)
      } catch (e) {
        console.error("UserStore.unfollowUser error:", e)
      }
    }),
  }))
  .actions((self) => ({
    loadUserWithId: flow(function* (userId: string) {
      console.debug("UserStore.loadUserWIthId called:", userId)
      self.isLoadingProfile = true

      try {
        const { privateUserRepository, feedRepository } = getEnv<RootStoreDependencies>(self)
        feedRepository.setCollectionPath(`feeds/${userId}/feedItems`)
        privateUserRepository.setUserId(userId)
        const user = yield privateUserRepository.get(userId, true)

        if (user) {
          self.user = user
          self.isNewUser = false
          yield self.getWorkouts()
        } else {
          self.isNewUser = true
        }

        self.isLoadingProfile = false
        self.isInitializing = false
      } catch (e) {
        console.error("UserStore.loadUserWIthId error:", e)
      }

      self.userId = userId
      console.debug("UserStore.loadUserWIthId done")
    }),
    setUser(user: User) {
      console.debug("UserStore.setUser called:", user)
      self.isLoadingProfile = true
      self.user = user
      self.getWorkouts()
      self.isLoadingProfile = false
    },
    updateProfile: flow(function* (userUpdate: Partial<User>) {
      console.debug("UserStore.updateProfile called")
      self.isLoadingProfile = true

      try {
        yield getEnv<RootStoreDependencies>(self).privateUserRepository.update(
          null,
          userUpdate,
          null,
        )
        self.user = { ...self.user, ...userUpdate }
        yield self.getWorkouts()

        self.isLoadingProfile = false
      } catch (e) {
        console.error("UserStore.updateProfile error:", e)
      }
      console.debug("UserStore.updateProfile done")
    }),
  }))
