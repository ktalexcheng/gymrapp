import { ExerciseSource, WeightUnit } from "app/data/constants"
import {
  Exercise,
  ExerciseId,
  ExerciseSettings,
  NewExercise,
  User,
  UserPreferences,
} from "app/data/model"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

const ExerciseSettingsModel = types
  .model({
    autoRestTimerEnabled: types.maybe(types.boolean),
    restTime: types.maybe(types.number),
    weightUnit: types.maybe(types.enumeration(Object.values(WeightUnit))),
  })
  .actions(withSetPropAction)

const ExerciseModel = types
  .model({
    exerciseId: types.identifier,
    exerciseSource: types.enumeration("exerciseSource", [
      ExerciseSource.Public,
      ExerciseSource.Private,
    ]),
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
    getExercise(exerciseId: string) {
      return self.allExercises.get(exerciseId)
    },
    getExerciseName(exerciseId: string) {
      return self.allExercises.get(exerciseId)?.exerciseName
    },
    setAllExercises(exercises: Exercise[]) {
      self.isLoading = true

      if (!exercises || exercises.length === 0) {
        self.isLoading = false
        console.warn("ExerciseStore.setAllExercises: received empty exercises list")
        return
      }

      exercises = convertFirestoreTimestampToDate(exercises)

      self.allExercises.clear()
      exercises.forEach((e) => {
        self.allExercises.put(e)
      })

      self.lastUpdated = new Date()
      self.isLoading = false
    },
    applyUserSettings: flow(function* () {
      self.isLoading = true

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      const exerciseSettings = yield userRepository.getUserProp(
        "preferences.exerciseSpecificSettings",
      )

      // Update exercises with user settings
      if (exerciseSettings) {
        exerciseSettings.forEach((item) => {
          self.allExercises.get(item.exerciseId).setProp("exerciseSettings", item.exerciseSettings)
        })
      }

      self.isLoading = false
    }),
  }))
  .actions((self) => ({
    getAllExercises: flow(function* () {
      self.isLoading = true

      try {
        // Fetch exercises and user settings
        const exercises: Exercise[] = yield getEnv<RootStoreDependencies>(
          self,
        ).exerciseRepository.getMany()
        console.debug("ExerciseStore.getAllExercises exercises.length:", exercises.length)
        self.setAllExercises(exercises)

        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.getAllExercises error:", e)
      }
    }),
    updateExerciseSetting(
      exerciseId,
      exerciseSettingsId: keyof ExerciseSettings,
      exerciseSettingsValue,
    ) {
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
        console.debug("ExerciseStoreModel.updateExerciseSetting: Creating new exerciseSettings")
        exercise.exerciseSettings = ExerciseSettingsModel.create()
      }
      exercise.exerciseSettings.setProp(exerciseSettingsId, exerciseSettingsValue)
      // self.allExercises.put(exercise)
    },
    uploadExerciseSettings: flow(function* () {
      self.isLoading = true

      try {
        const exerciseSpecificSettings: UserPreferences["exerciseSpecificSettings"] = Array.from(
          self.allExercises.values(),
        ).reduce((acc, e) => {
          if (!e.exerciseSettings) acc.set(e.exerciseId, e.exerciseSettings)
          return acc
        }, new Map<ExerciseId, ExerciseSettings>())

        if (exerciseSpecificSettings.size > 0) {
          getEnv<RootStoreDependencies>(self).userRepository.update(
            null,
            {
              preferences: exerciseSpecificSettings as Partial<UserPreferences>,
            } as Partial<User>,
            true,
          )
        }

        self.isLoading = false
      } catch (error) {
        console.error("ExerciseStore.uploadExerciseSettings error:", error)
      }
    }),
    createPrivateExercise: flow(function* (newExercise: NewExercise) {
      self.isLoading = true

      try {
        yield getEnv(self).exerciseRepository.create({
          ...newExercise,
          exerciseSource: ExerciseSource.Private,
        })

        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.createNewExercise error:", e)
      }
    }),
  }))
