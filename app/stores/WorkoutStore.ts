import firestore from "@react-native-firebase/firestore"
import { ActivityId } from "app/data/model/activityModel"
import { differenceInSeconds } from "date-fns"
import { SnapshotIn, destroy, flow, getEnv, types } from "mobx-state-tree"
import { ExerciseSetType, ExerciseVolumeType, WorkoutVisibility } from "../../app/data/constants"
import {
  ExerciseHistory,
  ExercisePerformed,
  ExerciseSet,
  Gym,
  NewExerciseRecord,
  NewWorkout,
  RepsExerciseSet,
  RepsPersonalRecord,
  TimeExerciseSet,
  TimePersonalRecord,
  User,
} from "../../app/data/model"
import { translate } from "../../app/i18n"
import { formatSecondsAsTime } from "../../app/utils/formatSecondsAsTime"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

const SingleExerciseSet = types
  .model({
    setOrder: types.number,
    setType: types.enumeration<ExerciseSetType>(Object.values(ExerciseSetType)),
    volumeType: types.enumeration<ExerciseVolumeType>(Object.values(ExerciseVolumeType)),
    weight: types.maybeNull(types.number),
    reps: types.maybeNull(types.number),
    time: types.maybeNull(types.number),
    rpe: types.maybeNull(types.number),
    isCompleted: false,
  })
  .views((self) => ({
    get validWeight() {
      return self.weight !== undefined
    },
    get validReps() {
      return self.reps !== undefined
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    updateSetValues(prop: "weight" | "reps" | "rpe" | "time", value: number) {
      if (value !== null && value !== undefined && value >= 0) {
        self.setProp(prop, value)
      } else {
        self.setProp(prop, undefined)
      }
    },
  }))

const ExerciseSets = types.array(SingleExerciseSet)

const SingleExercise = types
  .model({
    exerciseOrder: types.number,
    exerciseId: types.string,
    volumeType: types.enumeration<ExerciseVolumeType>(Object.values(ExerciseVolumeType)),
    setsPerformed: types.optional(ExerciseSets, []),
    exerciseNotes: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)

const Exercises = types.array(SingleExercise)

const WorkoutStoreModel = types
  .model("WorkoutStore")
  .props({
    startTime: types.maybe(types.Date),
    endTime: types.maybe(types.Date),
    exercises: types.optional(Exercises, []),
    inProgress: false,
    restTime: 0,
    restTimeRemaining: 0,
    restTimeRunning: false,
    lastSetCompletedTime: types.maybe(types.Date),
    workoutTitle: translate("activeWorkoutScreen.newActiveWorkoutTitle"),
    activityId: types.maybe(types.string),
    performedAtGymId: types.maybe(types.string),
    performedAtGymName: types.maybe(types.string),
  })
  .views((self) => ({
    get isAllSetsCompleted() {
      if (!self.exercises.length) return false

      let allSetsCompleted = true
      for (const e of self.exercises.values()) {
        for (const s of e.setsPerformed) {
          if (!s.isCompleted) {
            allSetsCompleted = false
            break
          }
        }
        if (!allSetsCompleted) break
      }

      return allSetsCompleted
    },
    get timeElapsedFormatted() {
      const duration = differenceInSeconds(new Date(), self.startTime)
      return formatSecondsAsTime(duration, true)
    },
    get totalVolume() {
      let total = 0
      self.exercises.forEach((e) => {
        e.setsPerformed.forEach((s) => {
          total += s.isCompleted ? s.weight * s.reps : 0
        })
      })

      return total
    },
    get timeSinceLastSetFormatted() {
      if (self.lastSetCompletedTime !== undefined) {
        const duration = differenceInSeconds(new Date(), self.lastSetCompletedTime)
        return formatSecondsAsTime(duration)
      }

      return "00:00"
    },
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    resetWorkout() {
      self.startTime = new Date()
      self.lastSetCompletedTime = undefined
      self.restTime = 0
      self.restTimeRemaining = 0
      self.exercises = Exercises.create()
      self.workoutTitle = translate("activeWorkoutScreen.newActiveWorkoutTitle")
      self.performedAtGymId = undefined
      self.performedAtGymName = undefined
    },
    cleanUpWorkout() {
      // Remove incompleted sets
      self.exercises.forEach((e) => {
        e.setsPerformed.forEach((s) => {
          !s.isCompleted && destroy(s)
        })
      })
    },
    setGym(gym: Gym) {
      self.performedAtGymId = gym.gymId
      self.performedAtGymName = gym.gymName
    },
    allExerciseSummary: flow(function* () {
      const exercisesSummary: ExercisePerformed[] = []

      // self.exercises.forEach(async (e) => {
      for (const e of self.exercises.values()) {
        const exerciseHistory: ExerciseHistory = yield getEnv<RootStoreDependencies>(
          self,
        ).userRepository.getUserProp("exerciseHistory")
        const exerciseRecord = exerciseHistory && exerciseHistory?.[e.exerciseId]?.personalRecords
        let bestSet = {} as ExerciseSet
        const newRecords = {} as NewExerciseRecord

        if (e.volumeType === ExerciseVolumeType.Reps) {
          let totalReps = 0
          let totalVolume = 0

          e.setsPerformed.forEach((s) => {
            if (!s.reps || s.reps === 0) return

            totalReps += s.reps
            totalVolume += s.weight * s.reps

            if (s.weight > ((bestSet as RepsExerciseSet)?.weight || 0))
              bestSet = s as RepsExerciseSet

            const exerciseRepRecord = exerciseRecord && exerciseRecord?.[s.reps]
            const recordsCount = exerciseRepRecord && Object.keys(exerciseRepRecord).length
            if (s.weight > ((recordsCount && exerciseRepRecord[recordsCount - 1].weight) || 0)) {
              if (
                newRecords[s.reps] &&
                s.weight < (newRecords[s.reps] as RepsPersonalRecord)?.weight
              )
                return

              newRecords[s.reps] = {
                // exerciseId: e.exerciseId,
                datePerformed: self.startTime,
                weight: s.weight,
                reps: s.reps,
              } as RepsPersonalRecord
            }
          })

          exercisesSummary.push({
            ...e,
            volumeType: ExerciseVolumeType.Reps,
            bestSet,
            datePerformed: self.startTime,
            totalReps,
            totalVolume,
            newRecords,
          })
        } else if (e.volumeType === ExerciseVolumeType.Time) {
          let totalTime = 0

          e.setsPerformed.forEach((s) => {
            if (!s.time || s.time === 0) return

            totalTime += s.time

            if (s.time > ((bestSet as TimeExerciseSet)?.time || 0)) bestSet = s as TimeExerciseSet

            // For time based exercises, records are only stored at the index 0
            const exerciseTimeRecord = exerciseRecord && exerciseRecord?.[0]
            const recordsCount = exerciseTimeRecord && Object.keys(exerciseTimeRecord).length
            if (s.time > ((recordsCount && exerciseTimeRecord[recordsCount - 1].time) || 0)) {
              if (newRecords[0] && s.time < (newRecords[0] as TimePersonalRecord)?.time) return

              newRecords[0] = {
                // exerciseId: e.exerciseId,
                datePerformed: self.startTime,
                time: s.time,
              } as TimePersonalRecord
            }
          })

          exercisesSummary.push({
            ...e,
            volumeType: ExerciseVolumeType.Time,
            bestSet,
            datePerformed: self.startTime,
            totalTime,
            newRecords,
          })
        }
      }

      return exercisesSummary
    }),
  }))
  .actions((self) => ({
    startNewWorkout(activityId: ActivityId) {
      self.resetWorkout()
      self.activityId = activityId
      self.inProgress = true
    },
    pauseWorkout() {
      self.endTime = new Date()
    },
    resumeWorkout() {
      self.endTime = undefined
    },
    endWorkout() {
      // self.resetWorkout()
      self.endTime = new Date()
      self.inProgress = false
    },
    saveWorkout: flow(function* () {
      try {
        if (self.inProgress) {
          console.warn("WorkoutStore.saveWorkout: Unable to save, workout still in progress")
          return undefined
        }

        self.cleanUpWorkout()

        // console.debug("WorkoutStore.exerciseSummary:", self.exerciseSummary)
        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const userId = yield userRepository.getUserProp("userId")
        const privateAccount = yield userRepository.getUserProp("privateAccount")
        const allExerciseSummary = yield self.allExerciseSummary()
        const newWorkout = {
          byUserId: userId,
          visibility: privateAccount ? WorkoutVisibility.Private : WorkoutVisibility.Public,
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: allExerciseSummary,
          workoutTitle: self.workoutTitle,
          activityId: self.activityId,
          performedAtGymId: self.performedAtGymId ?? null,
          performedAtGymName: self.performedAtGymName ?? null,
        } as NewWorkout
        console.debug("WorkoutStore.saveWorkout newWorkout:", newWorkout)
        const workoutId = yield getEnv<RootStoreDependencies>(self).workoutRepository.create(
          newWorkout,
        )

        // Update user workout metadata (keep track of workouts performed by user)
        yield getEnv<RootStoreDependencies>(self).userRepository.update(
          null,
          {
            workoutMetas: {
              [workoutId]: {
                startTime: self.startTime,
              },
            },
          },
          true,
        )

        // Update user exercise history
        const userUpdate = {} as Partial<User>
        allExerciseSummary.forEach((e) => {
          userUpdate[`exerciseHistory.${e.exerciseId}.performedWorkoutIds`] =
            firestore.FieldValue.arrayUnion(workoutId)
          if (Object.keys(e.newRecords).length > 0) {
            Object.entries(e.newRecords).forEach(([rep, record]) => {
              const newRecord = firestore.FieldValue.arrayUnion(record)
              userUpdate[`exerciseHistory.${e.exerciseId}.personalRecords.${rep}`] = newRecord
            })
          }
        })
        yield getEnv<RootStoreDependencies>(self).userRepository.update(null, userUpdate, false)

        self.resetWorkout()
        return workoutId
      } catch (error) {
        console.error("WorkoutStore.saveWorkout error:", error)
        return undefined
      }
    }),
    addExercise(newExerciseId: string, volumeType: ExerciseVolumeType) {
      const newExerciseOrder = self.exercises.length
      const newExercise = SingleExercise.create({
        exerciseOrder: newExerciseOrder,
        exerciseId: newExerciseId,
        volumeType,
        setsPerformed: [],
      })
      self.exercises.push(newExercise)
    },
    removeExercise(exerciseOrder: number) {
      self.exercises.splice(exerciseOrder, 1)
      self.exercises.forEach((e, i) => {
        e.exerciseOrder = i
      })
    },
    addSet(targetExerciseOrder: number, newSetObject: SnapshotIn<typeof SingleExerciseSet>) {
      const exercise = self.exercises.at(targetExerciseOrder)
      const newSetOrder = exercise.setsPerformed.length
      const newSet = SingleExerciseSet.create({
        setOrder: newSetOrder,
        volumeType: exercise.volumeType,
        ...newSetObject,
      })
      exercise.setsPerformed.push(newSet)
    },
    removeSet(targetExerciseOrder: number, targetExerciseSetOrder: number) {
      const targetExercise = self.exercises.at(targetExerciseOrder)
      const sets = targetExercise.setsPerformed
      sets.splice(targetExerciseSetOrder, 1)
      sets.forEach((s, i) => {
        s.setOrder = i
      })
    },
  }))
  .actions((self) => {
    let intervalId

    const setRestTime = (seconds: number) => {
      const _seconds = seconds < 0 ? 0 : seconds
      self.restTime = _seconds
      self.restTimeRemaining = _seconds
    }

    const adjustRestTime = (seconds: number) => {
      self.restTime = self.restTime + seconds < 0 ? 0 : self.restTime + seconds
      self.restTimeRemaining =
        self.restTimeRemaining + seconds < 0 ? 0 : self.restTimeRemaining + seconds
    }

    const startRestTimer = () => {
      self.lastSetCompletedTime = new Date()
      intervalId = setInterval(() => {
        if (self.restTimeRemaining > 0) {
          self.setProp("restTimeRemaining", self.restTimeRemaining - 1)
        } else {
          console.debug("WorkoutStore.startRestTimer cleared")
          clearInterval(intervalId)
          self.setProp("restTimeRunning", false)
        }
      }, 1000)
      self.restTimeRunning = true
    }

    const stopRestTimer = () => {
      if (intervalId) {
        clearInterval(intervalId)
        self.restTimeRunning = false
      }
    }

    const resetRestTimer = () => {
      stopRestTimer()
      setRestTime(self.restTime)
    }

    const restartRestTimer = (seconds: number) => {
      stopRestTimer()
      setRestTime(seconds)
      startRestTimer()
    }

    return {
      setRestTime,
      adjustRestTime,
      startRestTimer,
      pauseRestTimer: stopRestTimer,
      resetRestTimer,
      restartRestTimer,
    }
  })

export { ExerciseSets, WorkoutStoreModel }
