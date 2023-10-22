import firestore from "@react-native-firebase/firestore"
import { ActivityId } from "app/data/model/activityModel"
import { differenceInSeconds } from "date-fns"
import { SnapshotIn, destroy, flow, getEnv, types } from "mobx-state-tree"
import { ExerciseSetType, WorkoutVisibility } from "../../app/data/constants"
import {
  ExercisePerformed,
  ExerciseSet,
  Gym,
  NewExerciseRecord,
  NewWorkout,
  PersonalRecord,
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
    weight: types.maybe(types.number),
    reps: types.maybe(types.number),
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
    updateSetValues(prop: "weight" | "reps" | "rpe", value: number) {
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
    get exerciseSummary() {
      const exercisesSummary: ExercisePerformed[] = []
      const exerciseHistory =
        getEnv<RootStoreDependencies>(self).userRepository.getUserProp("exerciseHistory")

      self.exercises.forEach((e) => {
        const exerciseRecord = exerciseHistory && exerciseHistory?.[e.exerciseId]?.personalRecords
        let maxWeightSet = {} as ExerciseSet
        let totalReps = 0
        let totalVolume = 0
        const newRecords = {} as NewExerciseRecord

        e.setsPerformed.forEach((s) => {
          if (!s.reps || s.reps === 0) return

          totalReps += s.reps
          totalVolume += s.weight * s.reps

          if (s.weight > (maxWeightSet?.weight || 0)) maxWeightSet = s

          const exerciseRepRecord = exerciseRecord && exerciseRecord?.[s.reps]
          const recordsCount = exerciseRepRecord && Object.keys(exerciseRepRecord).length
          if (s.weight > ((recordsCount && exerciseRepRecord[recordsCount - 1].weight) || 0)) {
            newRecords[s.reps] = {
              // exerciseId: e.exerciseId,
              datePerformed: self.startTime,
              weight: s.weight,
              reps: s.reps,
            } as PersonalRecord
          }
        })

        exercisesSummary.push({
          ...e,
          maxWeightSet,
          datePerformed: self.startTime,
          totalReps,
          totalVolume,
          newRecords,
        })
      })

      return exercisesSummary
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
          return
        }

        self.cleanUpWorkout()

        // console.debug("WorkoutStore.exerciseSummary:", self.exerciseSummary)
        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const userId = yield userRepository.getUserProp("userId")
        const privateAccount = yield userRepository.getUserProp("privateAccount")
        const newWorkout = {
          byUserId: userId,
          visibility: privateAccount ? WorkoutVisibility.Private : WorkoutVisibility.Public,
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: self.exerciseSummary,
          workoutTitle: self.workoutTitle,
          activityId: self.activityId,
        } as NewWorkout
        // console.debug("WorkoutStore.saveWorkout newWorkout:", newWorkout)
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
        self.exerciseSummary.forEach((e) => {
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
      }
    }),
    addExercise(newExerciseId: string) {
      const newExerciseOrder = self.exercises.length
      const newExercise = SingleExercise.create({
        exerciseOrder: newExerciseOrder,
        exerciseId: newExerciseId,
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
