import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { ExerciseStoreModel } from "./ExerciseStore"
import { WorkoutStoreModel } from "./WorkoutStore"
/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  workoutStore: types.optional(WorkoutStoreModel, {}),
  exerciseStore: types.optional(ExerciseStoreModel, {})
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
