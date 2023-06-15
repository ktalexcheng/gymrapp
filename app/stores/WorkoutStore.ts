import { ExerciseSetType, NewWorkout } from "app/data/model"
import { translate } from "app/i18n"
import { formatDuration } from "app/utils/formatDuration"
import { SnapshotIn, destroy, flow, getEnv, types } from "mobx-state-tree"
import moment from "moment"
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

const ExerciseSets = types.array(SingleExerciseSet)

const SingleExercise = types
  .model({
    exerciseOrder: types.number,
    exerciseId: types.string,
    setsPerformed: types.optional(ExerciseSets, []),
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
    workoutTitle: translate("activeWorkoutScreen.newActiveWorkoutTitle"),
  })
  .views((self) => ({
    get isAllSetsCompleted() {
      let allSetsCompleted = true

      for (const e of self.exercises) {
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
      const start = moment(self.startTime)
      const duration = moment.duration(moment().diff(start))
      console.debug("WorkoutStore.timeElapsedFormatted:", formatDuration(duration))
      return formatDuration(duration)
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
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    resetWorkout() {
      self.startTime = new Date()
      self.restTime = 0
      self.restTimeRemaining = 0
      self.exercises = Exercises.create()
      self.workoutTitle = translate("activeWorkoutScreen.newActiveWorkoutTitle")
    },
  }))
  .actions((self) => ({
    startNewWorkout() {
      self.resetWorkout()
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
      self.inProgress = false
    },
    saveWorkout: flow(function* () {
      try {
        if (self.inProgress) {
          console.error("WorkoutStore().saveWorkout(): Unable to save, workout still in progress")
          return
        }

        // Remove incompleted sets
        self.exercises.forEach((e) => {
          e.setsPerformed.forEach((s) => {
            !s.isCompleted && destroy(s)
          })
        })

        const workoutId = yield getEnv<RootStoreDependencies>(self).workoutRepository.create({
          byUser: getEnv<RootStoreDependencies>(self).userRepository.user.userId,
          privateUser: getEnv<RootStoreDependencies>(self).userRepository.user.privateAccount,
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: self.exercises,
          workoutTitle: self.workoutTitle,
        } as NewWorkout)

        getEnv<RootStoreDependencies>(self).userRepository.saveNewWorkoutMeta({
          [workoutId]: {
            endTime: self.endTime,
          },
        })
        self.resetWorkout()
      } catch (error) {
        console.error("WorkoutStore().saveWorkout().error:", error)
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
      const newSetOrder = self.exercises[targetExerciseOrder].setsPerformed.length
      const newSet = SingleExerciseSet.create({
        setOrder: newSetOrder,
        ...newSetObject,
      })
      self.exercises[targetExerciseOrder].setsPerformed.push(newSet)
    },
  }))
  .actions((self) => {
    let intervalId

    const setRestTime = (time: number) => {
      self.restTime = time
      self.restTimeRemaining = time
    }

    const startRestTimer = () => {
      intervalId = setInterval(() => {
        if (self.restTimeRemaining > 0) {
          self.setProp("restTimeRemaining", self.restTimeRemaining - 1)
        } else {
          console.debug("WorkoutStore.startRestTimer() cleared")
          clearInterval(intervalId)
        }
      }, 1000)
    }

    const stopRestTimer = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    const restartRestTimer = (time: number) => {
      stopRestTimer()
      setRestTime(time)
      startRestTimer()
    }

    return { setRestTime, startRestTimer, stopRestTimer, restartRestTimer }
  })

export { ExerciseSets, WorkoutStoreModel }
