import { ExerciseSource, ExerciseVolumeType, WeightUnit } from "app/data/constants"
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
    volumeType: types.enumeration("exerciseVolumeType", Object.values(ExerciseVolumeType)),
    hasLeaderboard: types.boolean,
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
  // .views((self) => ({
  //   get allActivityTypes() {
  //     const arr = Array.from(self.allExercises.values())
  //     const types = new Set(arr.map((item) => item.activityName))

  //     return Array.from(types)
  //   },
  //   get allExerciseCat1() {
  //     const arr = Array.from(self.allExercises.values())
  //     const subtypes = new Set(arr.map((item) => item.exerciseCat1))

  //     return Array.from(subtypes)
  //   },
  //   get allExerciseCat2() {
  //     const arr = Array.from(self.allExercises.values())
  //     const categories = new Set(arr.map((item) => item.exerciseCat2))

  //     return Array.from(categories)
  //   },
  //   get volumeType() {
  //     const arr = Array.from(self.allExercises.values())
  //     const volumeTypes = new Set(arr.map((item) => item.volumeType))

  //     return Array.from(volumeTypes)
  //   },
  //   get isAllExercisesEmpty() {
  //     return self.allExercises.size === 0
  //   },
  // }))
  .actions(withSetPropAction)
  .actions((self) => ({
    getPropEnumValues(propName: keyof Exercise) {
      const arr = Array.from(self.allExercises.values())
      const propValues = new Set(arr.map((item) => item[propName]))

      return Array.from(propValues)
    },
    getExercise(exerciseId: string) {
      return self.allExercises.get(exerciseId)
    },
    getExerciseName(exerciseId: string) {
      return self.allExercises.get(exerciseId)?.exerciseName
    },
    getExerciseVolumeType(exerciseId: string) {
      return self.allExercises.get(exerciseId).volumeType
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
        // Fetch exercises
        const { exerciseRepository, privateExerciseRepository } =
          getEnv<RootStoreDependencies>(self)
        const exercises: Exercise[] = yield exerciseRepository.getMany()
        const privateExercises: Exercise[] = yield privateExerciseRepository.getMany()
        console.debug("ExerciseStore.getAllExercises exercises.length:", exercises.length)
        console.debug(
          "ExerciseStore.getAllExercises privateExercises.length:",
          privateExercises.length,
        )
        self.setAllExercises([...exercises, ...privateExercises])

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
        const { privateExerciseRepository } = getEnv<RootStoreDependencies>(self)
        const _newExercise = {
          ...newExercise,
          hasLeaderboard: false,
          exerciseSource: ExerciseSource.Private,
        }
        const newExerciseId = yield privateExerciseRepository.create(_newExercise)
        self.allExercises.put({
          ..._newExercise,
          exerciseId: newExerciseId,
        })

        self.lastUpdated = new Date()
        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.createNewExercise error:", e)
      }
    }),
  }))
