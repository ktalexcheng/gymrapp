import { Exercise, ExerciseSettings } from "app/data/model"
import { flow, getEnv, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

const ExerciseSettingsModel = types
  .model({
    autoRestTimerEnabled: types.optional(types.boolean, false),
    restTime: types.optional(types.number, 120),
  })
  .actions(withSetPropAction)

const ExerciseModel = types.model({
  exerciseId: types.identifier,
  exerciseSource: types.enumeration("Source", ["Public", "Private"]),
  exerciseType: types.string,
  exerciseCategory: types.string,
  exerciseName: types.string,
  exerciseSettings: types.maybe(ExerciseSettingsModel),
})

export const ExerciseStoreModel = types
  .model("ExerciseStore")
  .props({
    allExercises: types.map(ExerciseModel),
    lastUpdated: types.maybe(types.Date),
  })
  .views((self) => ({
    get allExerciseTypes() {
      const arr = Array.from(self.allExercises.values())
      const types = new Set(arr.map((item) => item.exerciseType))

      return Array.from(types)
    },
    get allExerciseCategories() {
      const arr = Array.from(self.allExercises.values())
      const categories = new Set(arr.map((item) => item.exerciseCategory))

      return Array.from(categories)
    },
  }))
  .views((self) => ({
    get allExercisesEmpty() {
      console.debug("ExerciseStoreModel.allExercises.size =", self.allExercises.size)
      return self.allExercises.size === 0
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getAllExercises: flow(function* () {
      console.debug("ExerciseStoreModel.getAllExercises() start")
      // Fetch exercises and user settings
      const exercises: Exercise[] = yield getEnv(self).exerciseRepository.getMany()
      const exerciseSettings: {
        exerciseId: string
        exerciseSettings: ExerciseSettings
      }[] = getEnv(self).userRepository.getUserExerciseSettings()
      console.debug("ExerciseStoreModel.getAllExercises() exercises:", exercises)
      console.debug("ExerciseStoreModel.getAllExercises() exerciseSettings:", exerciseSettings)

      // Merge exercises with user settings
      const exerciseMap: { [key: string]: Exercise } = {}
      exercises.forEach((item) => {
        exerciseMap[item.exerciseId] = item
      })
      if (exerciseSettings) {
        exerciseSettings.forEach((item) => {
          exerciseMap[item.exerciseId].exerciseSettings = item.exerciseSettings
        })
      }
      // const exerciseMap: Map<string, Exercise> = new Map()
      // exercises.forEach((item) => {
      //   exerciseMap.set(item.exerciseId, item)
      // })
      // exerciseSettings.forEach((item) => {
      //   exerciseMap[item.exerciseId].exerciseSettings = item.exerciseSettings
      // })

      // Set property
      self.allExercises.replace(exerciseMap)
      self.lastUpdated = new Date()
      console.debug("ExerciseStoreModel.getAllExercises() done")
    }),
    updateExerciseSetting(exerciseId, exerciseSettingsId, exerciseSettingsValue) {
      console.debug(
        "ExerciseStoreModel.updateExerciseSetting() start:",
        exerciseId,
        exerciseSettingsId,
        exerciseSettingsValue,
      )

      if (!self.allExercises.has(exerciseId)) {
        console.error("ExerciseStoreModel.updateExerciseSetting() Invalid exerciseId")
        return
      }
      if (!(exerciseSettingsId in ExerciseSettingsModel.properties)) {
        console.error("ExerciseStoreModel.updateExerciseSetting() Invalid exerciseSettingsId")
        return
      }

      const exercise = self.allExercises.get(exerciseId)
      if (!exercise.exerciseSettings) {
        exercise.exerciseSettings = ExerciseSettingsModel.create()
      }
      exercise.exerciseSettings.setProp(exerciseSettingsId, exerciseSettingsValue)
      self.allExercises.put(exercise)

      console.debug(
        "ExerciseStoreModel.updateExerciseSetting() done:",
        exerciseId,
        exerciseSettingsId,
        exerciseSettingsValue,
      )
    },
    uploadExerciseSettings: flow(function* () {
      console.debug("ExerciseStoreModel.updateExerciseSetting() start")
      const allExerciseSettings: {
        exerciseId: string
        exerciseSettings: ExerciseSettings
      }[] = Array.from(self.allExercises.values())
        .map((e) => {
          return {
            exerciseId: e.exerciseId,
            exerciseSettings: e.exerciseSettings,
          }
        })
        .filter((item) => item.exerciseSettings)

      console.debug(
        "ExerciseStoreModel.updateExerciseSetting() called userRepository.updateUserExerciseSettings():",
        allExerciseSettings,
      )
      getEnv(self).userRepository.updateUserExerciseSettings(allExerciseSettings)
      console.debug("ExerciseStoreModel.updateExerciseSetting() called userRepository.update()")
      yield getEnv(self).userRepository.update()
      console.debug("ExerciseStoreModel.updateExerciseSetting() done")
    }),
  }))
  .actions((self) => ({
    afterCreate() {
      console.debug("ExerciseStoreModel.afterCreate() fired")
      self.getAllExercises()
    },
  }))
