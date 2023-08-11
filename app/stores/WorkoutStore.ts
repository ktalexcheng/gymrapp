import firestore from "@react-native-firebase/firestore"
import { differenceInSeconds } from "date-fns"
import { SnapshotIn, destroy, flow, getEnv, types } from "mobx-state-tree"
import {
  ExercisePerformed,
  ExerciseSet,
  ExerciseSetType,
  NewExerciseRecord,
  NewWorkout,
  PersonalRecord,
  User,
  WorkoutVisibility,
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
    notes: types.maybeNull(types.string),
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
    activityId: types.maybe(types.string),
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
    get exerciseSummary() {
      const exercisesSummary: ExercisePerformed[] = []
      const exerciseHistory =
        getEnv<RootStoreDependencies>(self).userRepository.user?.exerciseHistory

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
              datePerformed: self.endTime,
              weight: s.weight,
              reps: s.reps,
            } as PersonalRecord
          }
        })

        exercisesSummary.push({
          ...e,
          maxWeightSet,
          datePerformed: self.endTime,
          totalReps,
          totalVolume,
          newRecords,
        })

        // exercisesSummary.push({
        //   ...e,
        //   maxWeightSet: e.setsPerformed.reduce(
        //     (max, set) => (set.weight > max.weight ? set : max),
        //     e.setsPerformed[0],
        //   ),
        //   datePerformed: self.startTime,
        //   totalReps: e.setsPerformed.reduce((reps, set) => reps + set.reps, 0),
        //   totalVolume: e.setsPerformed.reduce((volume, set) => volume + set.weight * set.reps, 0),
        //   newRecords: e.setsPerformed.reduce((pr, set) => {
        //     return set.weight > (exerciseRecord?.[set.reps]?.[0].weight || 0)
        //       ? ({
        //           [set.reps]: {
        //             exerciseId: e.exerciseId,
        //             datePerformed: self.startTime,
        //             weight: set.weight,
        //             reps: set.reps,
        //           } as PersonalRecord,
        //         } as NewExerciseRecord)
        //       : pr
        //   }, {}),
        // })
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
    },
  }))
  // .actions((self) => ({
  //   summarizeExercises(): ExercisePerformed[] {
  //     const exercisesSummary: ExercisePerformed[] = []
  //     const currentRecords = getEnv<RootStoreDependencies>(self).userRepository.user
  //       .exerciseRecords as Record<string, ExerciseRecord>

  //     self.exercises.forEach((e) => {
  //       exercisesSummary.push({
  //         ...e,
  //         maxWeightSet: e.setsPerformed.reduce(
  //           (max, set) => (set.weight > max.weight ? set : max),
  //           e.setsPerformed[0],
  //         ),
  //         datePerformed: self.startTime,
  //         totalReps: e.setsPerformed.reduce((reps, set) => reps + set.reps, 0),
  //         totalVolume: e.setsPerformed.reduce((volume, set) => volume + set.weight * set.reps, 0),
  //         newRecords: e.setsPerformed.reduce((pr, set) => {
  //           return set.weight > (currentRecords?.[e.exerciseId]?.[set.reps]?.weight || 0)
  //             ? ({
  //                 [set.reps]: {
  //                   exerciseId: e.exerciseId,
  //                   datePerformed: self.startTime,
  //                   weight: set.weight,
  //                   reps: set.reps,
  //                 } as PersonalRecord,
  //               } as ExerciseRecord)
  //             : pr
  //         }, {}),
  //       })
  //     })

  //     return exercisesSummary
  //   },
  // }))
  .actions((self) => ({
    startNewWorkout(activityId: string) {
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

        console.debug("WorkoutStore exerciseSummary:", self.exerciseSummary)
        const workoutId = yield getEnv<RootStoreDependencies>(self).workoutRepository.create({
          byUser: getEnv<RootStoreDependencies>(self).userRepository.user.userId,
          visibility: getEnv<RootStoreDependencies>(self).userRepository.user.privateAccount
            ? WorkoutVisibility.Private
            : WorkoutVisibility.Public,
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: self.exerciseSummary,
          workoutTitle: self.workoutTitle,
          activityId: self.activityId,
        } as NewWorkout)

        // Update user workout metadata (keep track of workouts performed by user)
        yield getEnv<RootStoreDependencies>(self).userRepository.update(
          {
            workoutMetas: {
              [workoutId]: {
                endTime: self.endTime,
              },
            },
          } as Partial<User>,
          true,
        )

        // Update user exercise history
        const userUpdate = {} as Partial<User>
        self.exerciseSummary.forEach((e) => {
          userUpdate[`exerciseHistory.${e.exerciseId}.performedWorkouts`] =
            firestore.FieldValue.arrayUnion(workoutId)
          if (Object.keys(e.newRecords).length > 0) {
            Object.entries(e.newRecords).forEach(([rep, record]) => {
              const newRecord = firestore.FieldValue.arrayUnion(record)
              userUpdate[`exerciseHistory.${e.exerciseId}.personalRecords.${rep}`] = newRecord
            })
          }
        })
        yield getEnv<RootStoreDependencies>(self).userRepository.update(userUpdate)

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
