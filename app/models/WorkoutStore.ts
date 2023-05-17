import { SnapshotIn, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

const SingleExerciseSet = types
  .model({
    setOrder: types.number,
    type: types.enumeration("SetType", ["WarmUp", "DropSet", "Failure", "Normal"]),
    weight: types.number,
    reps: types.number,
    ifCompleted: false,
  })
  .actions(withSetPropAction)

const ExerciseSets = types.array(SingleExerciseSet)

const SingleExercise = types
  .model({
    exerciseOrder: types.number,
    exerciseId: types.string,
    sets: ExerciseSets
  })
  .actions(withSetPropAction)

const Exercises = types.array(SingleExercise)

const WorkoutStoreModel = types
  .model("WorkoutStore")
  .props({
    startTime: types.maybe(types.Date),
    endTime: types.maybe(types.Date),
    inProgress: false,
    exercises: types.optional(Exercises, []),
  })
  .actions(withSetPropAction)
  .actions((self) => ({
    initNewWorkout() {
      self.startTime = new Date()
      self.exercises = Exercises.create()
      self.inProgress = true
    },
    pauseWorkout() {
      self.endTime = new Date()
      self.inProgress = false
    },
    resumeWorkout() {
      self.endTime = undefined
      self.inProgress = true
    },
    endWorkout() {
      // Workout should have been paused before ending
      if (self.inProgress) throw new Error("workout should be paused before ending")

      // TODO: Save workout to database
    },
    addExercise(newExerciseId: string) {
      const newExerciseOrder = self.exercises.length
      const newExercise = SingleExercise.create({
        exerciseOrder: newExerciseOrder,
        exerciseId: newExerciseId,
        sets: []
      })
      self.exercises.push(newExercise)
    },
    addSet(targetExerciseOrder: number, newSetObject: SnapshotIn<typeof SingleExerciseSet>) {
      const newSetOrder = self.exercises[targetExerciseOrder].sets.length
      const newSet = SingleExerciseSet.create({
        setOrder: newSetOrder,
        ...newSetObject
      })
      self.exercises[targetExerciseOrder].sets.push(newSet)
    },
    updateSetStatus(targetExerciseOrder: number, targetSetOrder: number, setStatus: boolean) {
      self.exercises[targetExerciseOrder].sets[targetSetOrder].ifCompleted = setStatus
    }
  }))

  export { WorkoutStoreModel, ExerciseSets }
