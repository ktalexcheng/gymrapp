import { Exercise, ExerciseSettings, NewExercise } from "app/data/model"
import { DefaultExerciseSettings } from "app/screens/ActiveWorkout/defaultExerciseSettings"
import { flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

const ExerciseSettingsModel = types
  .model({
    autoRestTimerEnabled: types.optional(
      types.boolean,
      DefaultExerciseSettings.autoRestTimerEnabled,
    ),
    restTime: types.optional(types.number, DefaultExerciseSettings.restTime),
  })
  .actions(withSetPropAction)

const ExerciseModel = types.model({
  exerciseId: types.identifier,
  exerciseSource: types.enumeration("Source", ["Public", "Private"]),
  exerciseType: types.string,
  exerciseSubtype: types.string,
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
    get allExerciseSubtypes() {
      const arr = Array.from(self.allExercises.values())
      const subtypes = new Set(arr.map((item) => item.exerciseSubtype))

      return Array.from(subtypes)
    },
    get allExerciseCategories() {
      const arr = Array.from(self.allExercises.values())
      const categories = new Set(arr.map((item) => item.exerciseCategory))

      return Array.from(categories)
    },
  }))
  .views((self) => ({
    get allExercisesEmpty() {
      return self.allExercises.size === 0
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getAllExercises: flow(function* () {
      try {
        // Fetch exercises and user settings
        const exercises: Exercise[] = yield getEnv(self).exerciseRepository.getMany()
        const exerciseSettings =
          getEnv<RootStoreDependencies>(self).userRepository.userExerciseSettings

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

        // Set property
        self.allExercises.replace(exerciseMap)
        self.lastUpdated = new Date()
      } catch (e) {
        console.error(e)
      }
    }),
    updateExerciseSetting(exerciseId, exerciseSettingsId, exerciseSettingsValue) {
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
    },
    uploadExerciseSettings: flow(function* () {
      try {
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

        getEnv<RootStoreDependencies>(self).userRepository.userExerciseSettings =
          allExerciseSettings
      } catch (error) {
        console.error("ExerciseStore().uploadExerciseSettings().error:", error)
      }
    }),
    createNewExercise: flow(function* (newExercise: NewExercise) {
      try {
        yield getEnv(self).exerciseRepository.create(newExercise)
      } catch (e) {
        console.error(e)
      }
    }),
  }))
  .actions((self) => ({
    afterCreate() {
      self.getAllExercises()
    },
  }))
