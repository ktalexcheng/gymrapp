import { ExercisePerformed, ExerciseSetType, NewWorkout } from "app/data/model"
import { translate } from "app/i18n"
import { formatSecondsAsTime } from "app/utils/formatSecondsAsTime"
import { differenceInSeconds } from "date-fns"
import { SnapshotIn, destroy, flow, getEnv, types } from "mobx-state-tree"
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
    updateSetValues(prop: "weight" | "reps" | "rpe", value: string) {
      if (value) {
        self.setProp(prop, Number(value))
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
    notes: types.maybe(types.string),
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
    lastSetCompletedTime: types.maybe(types.Date),
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
    },
  }))
  .actions((self) => ({
    summarizeExercises(): ExercisePerformed[] {
      const exercisesSummary: ExercisePerformed[] = []
      self.exercises.forEach((e) => {
        exercisesSummary.push({
          ...e,
          bestSet: e.setsPerformed.reduce(
            (max, set) => (set.weight > max.weight ? set : max),
            e.setsPerformed[0],
          ),
          datePerformed: self.endTime,
          totalReps: e.setsPerformed.reduce((reps, set) => reps + set.reps, 0),
          totalVolume: e.setsPerformed.reduce((volume, set) => volume + set.weight * set.reps, 0),
        })
      })

      return exercisesSummary
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
          console.warn("WorkoutStore.saveWorkout: Unable to save, workout still in progress")
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
          visibility: getEnv<RootStoreDependencies>(self).userRepository.user.privateAccount
            ? "private"
            : "public",
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: self.summarizeExercises(),
          workoutTitle: self.workoutTitle,
        } as NewWorkout)

        getEnv<RootStoreDependencies>(self).userRepository.saveNewWorkoutMeta({
          [workoutId]: {
            endTime: self.endTime,
          },
        })
        self.resetWorkout()
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
      const newSetOrder = self.exercises[targetExerciseOrder].setsPerformed.length
      const newSet = SingleExerciseSet.create({
        setOrder: newSetOrder,
        ...newSetObject,
      })
      self.exercises[targetExerciseOrder].setsPerformed.push(newSet)
    },
    removeSet(targetExerciseOrder: number, targetExerciseSetOrder: number) {
      self.exercises[targetExerciseOrder].setsPerformed.splice(targetExerciseSetOrder, 1)
      self.exercises[targetExerciseOrder].setsPerformed.forEach((s, i) => {
        s.setOrder = i
      })
    },
  }))
  .actions((self) => {
    let intervalId

    const setRestTime = (time: number) => {
      self.restTime = time
      self.restTimeRemaining = time
    }

    const startRestTimer = () => {
      self.lastSetCompletedTime = new Date()
      intervalId = setInterval(() => {
        if (self.restTimeRemaining > 0) {
          self.setProp("restTimeRemaining", self.restTimeRemaining - 1)
        } else {
          console.debug("WorkoutStore.startRestTimer cleared")
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
