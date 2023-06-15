import { User, Workout, isUser, isWorkout } from "app/data/model"
import { flow, getEnv, types } from "mobx-state-tree"
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
    isInitializing: true,
    isLoading: true,
    isLoadingWorkouts: true,
    isNewUser: true,
  })
  .views((self) => ({
    get profileIncomplete() {
      console.debug("UserStore.profileIncomplete checking")
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

      console.debug("UserStore.profileIncomplete: false")
      return false
    },
    get userProfileExists() {
      if (self.user === undefined || self.user === null) return false

      return true
    },
    get displayName() {
      if (self.user.firstName && self.user.lastName) {
        return `${self.user.firstName} ${self.user.lastName}`
      }

      console.warn("User display name not available. This should not be possible.")
      return self.user.email
    },
    get isPrivate() {
      return !!self.user.privateAccount
    },
  }))
  .actions((self) => ({
    /**
     * Creating a profile should usually be done right after signing up
     * this is for the rare case when a user's profile needs to be recreate
     */
    createNewProfile: flow(function* (user: User) {
      self.isLoading = true

      try {
        yield getEnv<RootStoreDependencies>(self).userRepository.create(user)
        self.user = user

        self.isLoading = false
        self.isInitializing = false
      } catch (e) {
        console.error(e)
      }
    }),

    getWorkouts: flow(function* () {
      console.debug("UserStore.getWorkouts() start")
      try {
        self.isLoadingWorkouts = true

        if (!self.user.workoutsMeta) {
          console.error("UserStore() unable to get workouts")
          self.isLoadingWorkouts = false
          return
        }

        const workoutIds = Object.keys(self.user.workoutsMeta)
        const workouts: Workout[] = yield getEnv<RootStoreDependencies>(
          self,
        ).workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.error("UserStore() unable to get workouts")
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
        console.error(e)
      }
      console.debug("UserStore.getWorkouts() done")
    }),
  }))
  .actions((self) => ({
    loadUserWithId: flow(function* (userId: string) {
      console.debug("UserStore.loadUserWIthId() start")
      self.isLoading = true

      try {
        const user = yield getEnv<RootStoreDependencies>(self).userRepository.get(userId)

        if (user) {
          self.user = user
          self.isNewUser = false
        } else {
          self.isNewUser = true
        }

        self.isLoading = false
        self.isInitializing = false
        yield self.getWorkouts()
      } catch (e) {
        console.error(e)
      }
      console.debug("UserStore.loadUserWIthId() done")
    }),
    updateProfile: flow(function* (user: Partial<User>) {
      console.debug("UserStore.updateProfile() start")
      self.isLoading = true

      try {
        yield getEnv<RootStoreDependencies>(self).userRepository.update(user.userId, user)
        self.user = { ...self.user, ...user }
        yield self.getWorkouts()

        self.isLoading = false
      } catch (e) {
        console.error(e)
      }
      console.debug("UserStore.updateProfile() done")
    }),
  }))
