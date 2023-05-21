import { types } from "mobx-state-tree"
import { ExerciseRepository } from "../data/repository"
import { withSetPropAction } from "./helpers/withSetPropAction"

const ExerciseModel = types
  .model({
    exerciseId: types.string,
    exerciseType: types.string,
    exerciseCategory: types.string,
    exerciseName: types.string,
  })

export const ExerciseStoreModel = types
  .model("ExerciseStore")
  .props({
    allExercises: types.maybe(types.array(ExerciseModel))
  })
  .views((self)=>({
    get allTypes() {
      return Array.from(new Set(self.allExercises.map((item) => item.exerciseType)))
    },
    get allCategories() {
      return Array.from(new Set(self.allExercises.map((item) => item.exerciseCategory)))
    }
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getAllExercises() {
      const exerciseRepository = new ExerciseRepository
      exerciseRepository.getMany().then((results) => {
        self.setProp("allExercises", results)
      })
    }
  }))
