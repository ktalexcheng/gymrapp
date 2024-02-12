import { ExerciseSource, ExerciseVolumeType } from "app/data/constants"
import { Exercise, ExerciseSettings, NewExercise, User } from "app/data/types"
import { SnapshotOrInstance, flow, getEnv, getSnapshot, types } from "mobx-state-tree"
import { ExerciseSettingsModel, IUserModel } from "./UserStore"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

// const ExerciseSettingsModel = types
//   .model({
//     autoRestTimerEnabled: types.maybe(types.boolean),
//     restTime: types.maybe(types.number),
//     weightUnit: types.maybe(types.enumeration(Object.values(WeightUnit))),
//   })
//   .actions(withSetPropAction)

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
    isLoading: true,
  })
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
  }))
  .actions(withSetPropAction)
  .actions((self) => {
    const applyUserSettings = flow(function* (user: IUserModel) {
      self.isLoading = true

      const exerciseSettings = user.preferences?.exerciseSpecificSettings

      // Update exercises with user settings
      if (exerciseSettings) {
        Object.entries(exerciseSettings).forEach(([exerciseId, settings]) => {
          self.allExercises.get(exerciseId)?.setProp("exerciseSettings", settings)
        })
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
        console.error("ExerciseStore.getAllExercises error:", e)
      }
    })

    function updateExerciseSetting(
      exerciseId,
      exerciseSettingsId: keyof ExerciseSettings,
      exerciseSettingsValue,
    ) {
      if (!self.allExercises.has(exerciseId)) {
        console.error("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseId")
        return
      }

      if (!(exerciseSettingsId in ExerciseSettingsModel.properties)) {
        console.error("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseSettingsId")
        return
      }

      const exercise = self.allExercises.get(exerciseId)
      if (!exercise) {
        console.error("ExerciseStoreModel.updateExerciseSetting error: Invalid exerciseId")
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

    const uploadExerciseSettings = flow(function* () {
      self.isLoading = true

      try {
        const exerciseSpecificSettings = Array.from(self.allExercises.values()).reduce((acc, e) => {
          if (e.exerciseSettings !== undefined)
            acc[e.exerciseId] = { ...getSnapshot(e.exerciseSettings) } // getSnapshot returns as serialized JS object
          return acc
        }, {})

        if (Object.keys(exerciseSpecificSettings).length > 0) {
          yield getEnv<RootStoreDependencies>(self).userRepository.update(
            null,
            {
              preferences: { exerciseSpecificSettings },
            } as Partial<User>,
            true,
          )
        }

        self.isLoading = false
      } catch (error) {
        console.error("ExerciseStore.uploadExerciseSettings error:", error)
      }
    })

    const createPrivateExercise = flow(function* (newExercise: NewExercise) {
      self.isLoading = true

      try {
        const { privateExerciseRepository } = getEnv<RootStoreDependencies>(self)
        const _newExercise = {
          ...newExercise,
          hasLeaderboard: false,
          exerciseSource: ExerciseSource.Private,
        }
        const createdExercise = yield privateExerciseRepository.create(_newExercise)
        self.allExercises.put({
          ..._newExercise,
          exerciseId: createdExercise.exerciseId,
        })

        self.lastUpdated = new Date()
        self.isLoading = false
      } catch (e) {
        console.error("ExerciseStore.createNewExercise error:", e)
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
