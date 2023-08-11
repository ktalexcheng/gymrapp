import { Exercise, ExerciseSettings, NewExercise, User } from "app/data/model"
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

const ExerciseModel = types
  .model({
    exerciseId: types.identifier,
    exerciseSource: types.enumeration("Source", ["Public", "Private"]),
    activityName: types.string,
    exerciseCat1: types.string,
    exerciseCat2: types.string,
    exerciseName: types.string,
    exerciseSettings: types.maybe(ExerciseSettingsModel),
  })
  .actions(withSetPropAction)

export const ExerciseStoreModel = types
  .model("ExerciseStore")
  .props({
    allExercises: types.map(ExerciseModel),
    lastUpdated: types.maybe(types.Date),
    isLoading: true,
  })
  .views((self) => ({
    get allExerciseTypes() {
      const arr = Array.from(self.allExercises.values())
      const types = new Set(arr.map((item) => item.activityName))

      return Array.from(types)
    },
    get allExerciseSubtypes() {
      const arr = Array.from(self.allExercises.values())
      const subtypes = new Set(arr.map((item) => item.exerciseCat1))

      return Array.from(subtypes)
    },
    get allExerciseCategories() {
      const arr = Array.from(self.allExercises.values())
      const categories = new Set(arr.map((item) => item.exerciseCat2))

      return Array.from(categories)
    },
    get isAllExercisesEmpty() {
      return self.allExercises.size === 0
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getExerciseName(exerciesId: string) {
      return self.allExercises.get(exerciesId).exerciseName
    },
    setAllExercises(exercises: Exercise[]) {
      self.isLoading = true

      if (!exercises || exercises.length === 0) {
        self.isLoading = false
        console.warn("ExerciseStore.setAllExercises: no exercises available")
        return
      }

      exercises.forEach((e) => {
        self.allExercises.put(e)
      })

      self.lastUpdated = new Date()
      self.isLoading = false
    },
    applyUser() {
      self.isLoading = true

      const exerciseSettings =
        getEnv<RootStoreDependencies>(self).userRepository.userExerciseSettings

      // Update exercises with user settings
      if (exerciseSettings) {
        exerciseSettings.forEach((item) => {
          self.allExercises.get(item.exerciseId).setProp("exerciseSettings", item.exerciseSettings)
        })
      }

      self.isLoading = false
    },
  }))
  .actions((self) => ({
    getAllExercises: flow(function* () {
      self.isLoading = true

      try {
        // Fetch exercises and user settings
        const exercises: Exercise[] = yield getEnv<RootStoreDependencies>(
          self,
        ).exerciseRepository.getMany()
        self.setAllExercises(exercises)

        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.getAllExercises error:", e)
      }
    }),
    updateExerciseSetting(exerciseId, exerciseSettingsId, exerciseSettingsValue) {
      if (!self.allExercises.has(exerciseId)) {
        console.warn("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseId")
        return
      }
      if (!(exerciseSettingsId in ExerciseSettingsModel.properties)) {
        console.warn("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseSettingsId")
        return
      }

      const exercise = self.allExercises.get(exerciseId)
      if (!exercise.exerciseSettings) {
        exercise.exerciseSettings = ExerciseSettingsModel.create()
      }
      exercise.exerciseSettings.setProp(exerciseSettingsId, exerciseSettingsValue)
      // self.allExercises.put(exercise)
    },
    uploadExerciseSettings: flow(function* () {
      self.isLoading = true

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

        if (allExerciseSettings.length > 0) {
          getEnv<RootStoreDependencies>(self).userRepository.update({
            allExerciseSettings,
          } as Partial<User>)
        }

        self.isLoading = false
      } catch (error) {
        console.error("ExerciseStore.uploadExerciseSettings error:", error)
      }
    }),
    createNewExercise: flow(function* (newExercise: NewExercise) {
      self.isLoading = true

      try {
        yield getEnv(self).exerciseRepository.create(newExercise)

        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.createNewExercise error:", e)
      }
    }),
  }))
