import { ExerciseSource, ExerciseVolumeType } from "app/data/constants"
import { Exercise, ExerciseSettings, NewExercise, User } from "app/data/types"
import { logError } from "app/utils/logger"
import { toJS } from "mobx"
import { SnapshotOrInstance, flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { ExerciseSettingsModel, IUserModelSnapshot } from "./models"

export const ExerciseModel = types
  .model({
    exerciseId: types.identifier,
    exerciseSource: types.enumeration("exerciseSource", [
      ExerciseSource.Public,
      ExerciseSource.Private,
    ]),
    activityName: types.string,
    exerciseCat1: types.string,
    exerciseCat2: types.maybeNull(types.string),
    exerciseName: types.string,
    volumeType: types.enumeration("exerciseVolumeType", Object.values(ExerciseVolumeType)),
    hasLeaderboard: types.boolean,
    exerciseSettings: types.maybe(ExerciseSettingsModel),
  })
  .actions(withSetPropAction)

export type IExerciseModel = SnapshotOrInstance<typeof ExerciseModel>

export const ExerciseStoreModel = types
  .model("ExerciseStore")
  .props({
    allExercises: types.map(ExerciseModel),
    lastUpdated: types.maybe(types.Date),
  })
  .volatile(() => ({
    isLoading: true,
  }))
  .views((self) => ({
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
      return self.allExercises.get(exerciseId)?.volumeType
    },
    get allExercisesArray() {
      return Array.from(self.allExercises.values())
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => {
    const applyUserSettings = flow(function* (user: IUserModelSnapshot) {
      self.isLoading = true

      const exerciseSettings = user.preferences?.exerciseSpecificSettings as ExerciseSettings

      // Update exercises with user settings
      console.debug("ExerciseStre.applyUserSettings() exerciseSettings", exerciseSettings)
      if (exerciseSettings) {
        // @ts-ignore: TS does not recognize the mobx map type
        for (const [exerciseId, settings] of exerciseSettings) {
          console.debug("ExerciseStore.applyUserSettings()", { exerciseId, settings })
          self.allExercises.get(exerciseId)?.setProp("exerciseSettings", settings)
        }
      }

      self.isLoading = false
    })

    const getAllExercises = flow(function* () {
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

        self.allExercises.clear()
        exercises.forEach((e) => {
          self.allExercises.put(e)
        })
        privateExercises.forEach((e) => {
          self.allExercises.put(e)
        })

        self.lastUpdated = new Date()
        self.isLoading = false
      } catch (e) {
        logError(e, "ExerciseStore.getAllExercises error")
      }
    })

    function updateExerciseSetting(
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
      if (!exercise) {
        console.warn("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseId")
        return
      }

      if (!exercise?.exerciseSettings) {
        console.debug("ExerciseStoreModel.updateExerciseSetting: Creating new exerciseSettings")
        exercise.exerciseSettings = ExerciseSettingsModel.create({
          exerciseId,
        })
      }
      exercise.exerciseSettings.setProp(exerciseSettingsId, exerciseSettingsValue)
      // self.allExercises.put(exercise)
    }

    const uploadExerciseSettings = flow(function* (isOffline = false) {
      self.isLoading = true

      try {
        const exerciseSpecificSettings = Array.from(self.allExercises.values()).reduce((acc, e) => {
          if (e.exerciseSettings !== undefined) acc[e.exerciseId] = { ...toJS(e.exerciseSettings) }
          return acc
        }, {})

        if (Object.keys(exerciseSpecificSettings).length > 0) {
          yield getEnv<RootStoreDependencies>(self).userRepository.update(
            null,
            {
              preferences: { exerciseSpecificSettings },
            } as Partial<User>,
            true,
            isOffline,
          )
        }

        self.isLoading = false
      } catch (error) {
        logError(error, "ExerciseStore.uploadExerciseSettings error")
      }
    })

    const createPrivateExercise = flow(function* (newExercise: NewExercise, isOffline = false) {
      self.isLoading = true

      try {
        const { privateExerciseRepository } = getEnv<RootStoreDependencies>(self)
        const newExerciseId = privateExerciseRepository.newDocumentId()
        const _newExercise = {
          ...newExercise,
          exerciseId: newExerciseId,
          hasLeaderboard: false,
          exerciseSource: ExerciseSource.Private,
        }
        yield privateExerciseRepository.create(toJS(_newExercise), isOffline)
        self.allExercises.put(_newExercise)

        self.lastUpdated = new Date()
        self.isLoading = false
      } catch (e) {
        logError(e, "ExerciseStore.createPrivateExercise error")
      }
    })

    return {
      applyUserSettings,
      getAllExercises,
      updateExerciseSetting,
      uploadExerciseSettings,
      createPrivateExercise,
    }
  })
