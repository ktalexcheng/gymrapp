import { UserStoreModel, WorkoutStoreModel } from "app/stores"
import { Instance, types } from "mobx-state-tree"

export const MockRootStoreModel = types.model("RootStore").props({
  userStore: types.optional(UserStoreModel, {}),
  workoutStore: types.optional(WorkoutStoreModel, {}),
})

export interface MockRootStore extends Instance<typeof MockRootStoreModel> {}
