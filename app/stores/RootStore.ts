import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { ActivityStoreModel } from "./ActivityStore"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { ExerciseStoreModel } from "./ExerciseStore"
import { FeedStoreModel } from "./FeedStore"
import { GymStoreModel } from "./GymStore"
import { ThemeStoreModel } from "./ThemeStore"
import { UserStoreModel } from "./UserStore"
import { WorkoutStoreModel } from "./WorkoutStore"
/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  userStore: types.optional(UserStoreModel, {}),
  activityStore: types.optional(ActivityStoreModel, {}),
  workoutStore: types.optional(WorkoutStoreModel, {}),
  exerciseStore: types.optional(ExerciseStoreModel, {}),
  feedStore: types.optional(FeedStoreModel, {}),
  gymStore: types.optional(GymStoreModel, {}),
  themeStore: types.optional(ThemeStoreModel, {}),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
