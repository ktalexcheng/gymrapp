import { User, Workout, isUser, isWorkout } from "app/data/model"
import { flow, getEnv, types } from "mobx-state-tree"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

const UserType = createCustomType<User>("User", isUser)
const WorkoutType = createCustomType<Workout>("Workout", isWorkout)

export const UserStoreModel = types
  .model("UserStoreModel")
  .props({
    user: UserType,
    workouts: types.map(
      types.model({
        workoutId: types.identifier,
        workout: WorkoutType,
      }),
    ),
    isLoading: true,
    isLoadingWorkouts: true,
  })
  .views((self) => ({
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
  .actions(withSetPropAction)
  .actions((self) => ({
    getProfile: flow(function* (userId: string) {
      self.isLoading = true

      try {
        const user = yield getEnv<RootStoreDependencies>(self).userRepository.get(userId)
        self.user = user
        self.isLoading = false
      } catch (e) {
        console.error(e)
      }
    }),
    getWorkouts: flow(function* () {
      self.isLoadingWorkouts = true

      if (!self.user.workoutsMeta) {
        console.warn("No workouts found for user")
        self.setProp("isLoadingWorkouts", false)
        return
      }

      const workoutIds = Object.keys(self.user.workoutsMeta)
      const workouts: Workout[] = yield getEnv<RootStoreDependencies>(
        self,
      ).workoutRepository.getMany(workoutIds)

      if (!workouts) {
        console.error("UserStore() unable to get workouts")
        self.setProp("isLoadingWorkouts", false)
        return
      }

      workouts.forEach((w) => {
        self.workouts.put({
          workoutId: w.workoutId,
          workout: w,
        })
      })
      self.setProp("isLoadingWorkouts", false)
    }),
    setPrivateAccount(isPrivate: boolean) {
      self.user.privateAccount = isPrivate

      try {
        getEnv<RootStoreDependencies>(self).userRepository.user = self.user
      } catch (e) {
        console.error(e)
      }
    },
  }))
