import { ExerciseSetType, NewWorkout } from "app/data/model"
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
  }))
  .actions(withSetPropAction)
  .actions((self) => ({
    resetWorkout() {
      self.startTime = new Date()
      self.restTime = 0
      self.restTimeRemaining = 0
      self.exercises = Exercises.create()
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
          startTime: self.startTime as Date,
          endTime: self.endTime as Date,
          exercises: self.exercises,
        } as NewWorkout)

        getEnv<RootStoreDependencies>(self).userRepository.userWorkouts = {
          [workoutId]: {
            endTime: self.endTime,
          },
        }
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
    addSet(targetExerciseOrder: number, newSetObject: SnapshotIn<typeof SingleExerciseSet>) {
      const newSetOrder = self.exercises[targetExerciseOrder].setsPerformed.length
      const newSet = SingleExerciseSet.create({
        setOrder: newSetOrder,
        ...newSetObject,
      })
      self.exercises[targetExerciseOrder].setsPerformed.push(newSet)
    },
    addRestTimeRemaining(seconds: number) {
      self.restTimeRemaining += seconds
    },
    subtractRestTimeRemaining(seconds: number) {
      self.restTimeRemaining -= seconds
    },
  }))

export { ExerciseSets, WorkoutStoreModel }
