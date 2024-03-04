import { ActivityId } from "app/data/types/activity.types"
import { differenceInSeconds } from "date-fns"
import * as Notifications from "expo-notifications"
import { IKeyValueMap } from "mobx"
import { Instance, SnapshotOrInstance, destroy, flow, getEnv, types } from "mobx-state-tree"
import { ExerciseSetType, ExerciseSource, ExerciseVolumeType } from "../../app/data/constants"
import { translate } from "../../app/i18n"
import { REST_TIMER_CHANNEL_ID } from "../data/constants"
import { Gym, NewWorkout } from "../data/types"
import { formatSecondsAsTime } from "../utils/formatTime"
import { IExerciseModel } from "./ExerciseStore"
import { IExerciseSummaryModel } from "./FeedStore"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"
import {
  IRepsPersonalRecordModel,
  IRepsSetPerformedModel,
  ISetPerformedModel,
  ITimePersonalRecordModel,
  ITimeSetPerformedModel,
  RepsSetPerformedModel,
  TimeSetPerformedModel,
  UserModel,
} from "./models"

const BaseExercisePerformedModel = types
  .model("BaseExercisePerformedModel", {
    exerciseOrder: types.number,
    exerciseId: types.string,
    exerciseSource: types.enumeration("ExerciseSource", Object.values(ExerciseSource)),
    exerciseName: types.string,
    exerciseNotes: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)

const RepsExercisePerformedModel = types.compose(
  "RepsExercisePerformedModel",
  BaseExercisePerformedModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Reps),
    setsPerformed: types.optional(types.array(RepsSetPerformedModel), []),
  }),
)

const TimeExercisePerformedModel = types.compose(
  "TimeExercisePerformedModel",
  BaseExercisePerformedModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Time),
    setsPerformed: types.optional(types.array(TimeSetPerformedModel), []),
  }),
)

const ExercisePerformedModel = types.union(
  { eager: true },
  RepsExercisePerformedModel,
  TimeExercisePerformedModel,
)

const Exercises = types.array(ExercisePerformedModel)

export type IExercisePerformedModel = SnapshotOrInstance<typeof ExercisePerformedModel>

export const WorkoutStoreModel = types
  .model("WorkoutStore")
  .props({
    startTime: types.maybe(types.Date),
    endTime: types.maybe(types.Date),
    exercises: types.optional(Exercises, []),
    inProgress: false,
    restTime: 0,
    restTimeStartedAt: types.maybe(types.Date),
    restTimeElapsed: 0,
    restTimeRunning: false,
    restTimeCompleted: false,
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
    get isEmptyWorkout() {
      // If there is at least one completed set, then the workout is not empty
      for (const e of self.exercises.values()) {
        for (const s of e.setsPerformed) {
          if (s.isCompleted) {
            return true
          }
        }
      }

      return false
    },
    get timeElapsedFormatted() {
      if (!self.startTime) return "00:00"

      const duration = differenceInSeconds(new Date(), self.startTime)
      return formatSecondsAsTime(duration, true)
    },
    get totalVolume() {
      let total = 0
      self.exercises.forEach((e) => {
        e.setsPerformed.forEach((s) => {
          if (s.volumeType === ExerciseVolumeType.Reps) {
            total += s.isCompleted ? (s.weight ?? 0) * (s.reps ?? 0) : 0
          }
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
  .actions((self) => {
    let intervalId
    let notificationId

    const setRestTime = (seconds: number) => {
      // Use the setProp action so this works in the setInterval callback
      self.setProp("restTime", Math.max(seconds, 0))
    }

    const adjustRestTime = (seconds: number) => {
      self.restTime = Math.max(self.restTime + seconds, 0)

      if (self.restTimeRunning) {
        scheduleRestNotifications()
      }
    }

    /**
     * Function to be called when rest timer is completed.
     */
    const handleEndOfTimer = () => {
      console.debug("WorkoutStore.handleEndOfTimer called")
      if (intervalId) {
        clearInterval(intervalId)
      }

      self.setProp("restTimeStartedAt", undefined)
      self.setProp("restTimeRunning", false)
      self.setProp("restTimeElapsed", 0)

      // Set restTimeCompleted to true for 3 seconds and then set it back to false
      self.setProp("restTimeCompleted", true)
      const timeout = setTimeout(() => {
        self.setProp("restTimeCompleted", false)
        clearTimeout(timeout)
      }, 3000)
    }

    /**
     * Stops the rest timer before completion and cancels any scheduled notifications.
     * Notifications need to be canceled.
     */
    const stopRestTimer = () => {
      handleEndOfTimer()
      cancelRestNotifications()
    }

    const startRestTimer = () => {
      const now = new Date()
      self.lastSetCompletedTime = now
      self.restTimeStartedAt = now
      self.restTimeRunning = true

      intervalId = setInterval(() => {
        // We need to calculate elapsed time instead of relying on a counter
        // just in case app went to background
        let actualTimeElapsed = 0
        if (self.restTimeStartedAt) {
          actualTimeElapsed = differenceInSeconds(new Date(), self.restTimeStartedAt)
        }
        self.setProp("restTimeElapsed", actualTimeElapsed)

        // If the app was in background when rest time elapsed, actualTimeElapsed could be greater than restTime
        // when the app comes back to foreground.
        if (actualTimeElapsed >= self.restTime) {
          handleEndOfTimer()
        }
      }, 1000)

      scheduleRestNotifications()
    }

    const resetRestTimer = () => {
      stopRestTimer()
    }

    const restartRestTimer = (seconds: number) => {
      stopRestTimer()
      setRestTime(seconds)
      startRestTimer()
    }

    /**
     * Schedule a notification to be sent when rest timer is completed.
     * If there is a notification already scheduled, it will be cancelled first.
     */
    const scheduleRestNotifications = async () => {
      // Make sure to cancel any existing notifications
      if (notificationId) {
        await dismissRestNotifications()
        await cancelRestNotifications()
      }

      // Find last set completed
      const lastCompletedExercise = self.exercises
        .filter((e) =>
          e.setsPerformed.some((s) => {
            console.debug("s.isCompleted", s.isCompleted)
            return s.isCompleted
          }),
        )
        .pop()
      const lastCompletedSet = lastCompletedExercise?.setsPerformed
        ?.filter((s) => s.isCompleted)
        ?.pop()
      console.debug("WorkoutStore.startRestTimer lastCompletedSet:", {
        lastCompletedExercise,
        lastCompletedSet,
      })

      let notificationMessage
      if (lastCompletedExercise && lastCompletedSet) {
        let setDescription = `${lastCompletedExercise.exerciseName}`
        switch (lastCompletedSet.volumeType) {
          case ExerciseVolumeType.Reps:
            setDescription += ` ${lastCompletedSet.weight ?? 0} kg`
            setDescription += ` x ${lastCompletedSet.reps}`
            if (lastCompletedSet.rpe) setDescription += ` @ RPE ${lastCompletedSet.rpe}`
            break
          case ExerciseVolumeType.Time:
            setDescription += ` ${formatSecondsAsTime(lastCompletedSet.time ?? 0)}`
            break
        }

        notificationMessage = translate(
          "notification.restTime.restTimeCompletedFromLastSetPrompt",
          {
            setDescription,
          },
        )
      } else {
        notificationMessage = translate("notification.restTime.restTimeCompletedGenericPrompt")
      }

      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          priority: Notifications.AndroidNotificationPriority.HIGH,
          title: translate("notification.restTime.restTimeCompletedTitle"),
          body: notificationMessage,
          data: {
            url: "gymrapp://activeWorkout",
          },
        },
        trigger: { seconds: self.restTime, channelId: REST_TIMER_CHANNEL_ID },
      })
    }

    const cancelRestNotifications = async () => {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId)
        console.debug("WorkoutStore.cancelRestNotifications canceled notification:", {
          notificationId,
        })

        notificationId = undefined
      }
    }

    const dismissRestNotifications = async () => {
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId)
        console.debug("WorkoutStore.dismissRestNotifications dismissed presented notification:", {
          notificationId,
        })
      }
    }

    return {
      setRestTime,
      adjustRestTime,
      startRestTimer,
      stopRestTimer,
      resetRestTimer,
      restartRestTimer,
      dismissRestNotifications,
    }
  })
  .views((self) => ({
    get restTimeRemaining() {
      if (!self.restTimeStartedAt || !self.restTimeRunning) return 0
      return self.restTime - self.restTimeElapsed
    },
    getExerciseLastSet(exerciseOrder: number) {
      const exercise = self.exercises[exerciseOrder]
      if (!exercise) return undefined

      return exercise.setsPerformed[exercise.setsPerformed.length - 1]
    },
  }))
  .actions((self) => {
    function resetWorkout() {
      self.startTime = new Date()
      self.lastSetCompletedTime = undefined
      self.restTime = 0
      // self.restTimeRemaining = 0
      self.restTimeStartedAt = undefined
      self.exercises = Exercises.create()
      self.workoutTitle = translate("activeWorkoutScreen.newActiveWorkoutTitle")
      self.performedAtGymId = undefined
      self.performedAtGymName = undefined
    }

    function cleanUpWorkout() {
      // Remove incompleted sets
      self.exercises.forEach((e) => {
        e.setsPerformed.forEach((s) => {
          !s.isCompleted && destroy(s)
        })
      })
    }

    function setGym(gym: Gym) {
      self.performedAtGymId = gym.gymId
      self.performedAtGymName = gym.gymName
    }

    const getLatestExerciseRecord = (
      user: Instance<typeof UserModel>,
      exerciseId: string,
      reps: number,
    ) => {
      const exerciseHistory = user.exerciseHistory
      const exercisePersonalRecords = exerciseHistory?.get(exerciseId)?.personalRecords
      console.debug("WorkoutStore.getLatestExerciseRecord()", {
        exerciseHistory,
        exercisePersonalRecords,
      })

      const exerciseRecords = exercisePersonalRecords?.get(reps)?.records
      if (!exerciseRecords) return null

      const recordsCount = exerciseRecords?.length
      const latestRecord = exerciseRecords[recordsCount - 1]

      return latestRecord
    }

    const getAllExerciseSummary = flow(function* (user: Instance<typeof UserModel>) {
      const exercisesSummary: IExerciseSummaryModel[] = []

      for (const e of self.exercises.values()) {
        if (e.volumeType === ExerciseVolumeType.Reps) {
          let bestSet = {} as IRepsSetPerformedModel
          const newRecords = {} as IKeyValueMap<IRepsPersonalRecordModel>
          let totalReps = 0
          let totalVolume = 0

          e.setsPerformed.forEach((s) => {
            if (!s.reps || s.reps === 0) {
              console.error("WorkoutStore.getAllExerciseSummary: Skipping set, reps is 0", {
                exercise: e,
                setsPerformed: s,
              })
              return
            }

            totalReps += s.reps
            totalVolume += (s.weight ?? 0) * s.reps

            if ((s.weight ?? 0) > (bestSet?.weight ?? -1)) {
              bestSet = s
            }

            let latestRecord = getLatestExerciseRecord(user, e.exerciseId, s.reps)
            // Safety check, in case the exercise was modified and the latest record is not a reps record
            if (latestRecord?.volumeType !== ExerciseVolumeType.Reps) latestRecord = null

            if ((s.weight ?? 0) > (latestRecord?.weight ?? 0)) {
              // Make sure we don't overwrite a new record with a lower weight
              if (newRecords[s.reps] && (s.weight ?? 0) < (newRecords[s.reps].weight ?? 0)) return

              newRecords[s.reps] = {
                // exerciseId: e.exerciseId,
                volumeType: ExerciseVolumeType.Reps,
                datePerformed: self.startTime ?? new Date(),
                weight: s.weight,
                reps: s.reps,
              }
            }
          })

          exercisesSummary.push({
            ...e,
            volumeType: ExerciseVolumeType.Reps,
            bestSet,
            datePerformed: self.startTime! ?? new Date(),
            totalReps,
            totalVolume,
            newRecords,
          })
        } else if (e.volumeType === ExerciseVolumeType.Time) {
          let bestSet = {} as ITimeSetPerformedModel
          const newRecords = {} as IKeyValueMap<ITimePersonalRecordModel>
          let totalTime = 0

          e.setsPerformed.forEach((s) => {
            if (!s.time || s.time === 0) {
              console.error("WorkoutStore.getAllExerciseSummary: Skipping set, time is 0", {
                exercise: e,
                setsPerformed: s,
              })
              return
            }

            totalTime += s.time

            if (s.time > (bestSet.time || 0)) {
              bestSet = s
            }

            let latestRecord = getLatestExerciseRecord(user, e.exerciseId, 0)
            // Safety check, in case the exercise was modified and the latest record is not a time record
            if (latestRecord?.volumeType !== ExerciseVolumeType.Time) latestRecord = null

            if (s.time > (latestRecord?.time ?? 0)) {
              // Make sure we don't overwrite a new record with a shorter time
              if (newRecords[0] && s.time < newRecords[0].time) return

              newRecords[0] = {
                // exerciseId: e.exerciseId,
                reps: 0, // For time based exercises, reps is always 0
                volumeType: ExerciseVolumeType.Time,
                datePerformed: self.startTime ?? new Date(),
                time: s.time,
              }
            }
          })

          exercisesSummary.push({
            ...e,
            volumeType: ExerciseVolumeType.Time,
            bestSet,
            datePerformed: self.startTime ?? new Date(),
            totalTime,
            newRecords,
          })
        }
      }

      return exercisesSummary
    })

    function startNewWorkout(activityId: ActivityId) {
      resetWorkout()
      self.activityId = activityId
      self.inProgress = true
    }

    function pauseWorkout() {
      self.endTime = new Date()
    }

    function resumeWorkout() {
      self.endTime = undefined
    }

    function endWorkout() {
      self.endTime = new Date()
      self.stopRestTimer()
      self.inProgress = false
    }

    const saveWorkout = flow(function* (isHidden: boolean, user: Instance<typeof UserModel>) {
      try {
        if (self.inProgress) {
          console.warn("WorkoutStore.saveWorkout: Unable to save, workout still in progress")
          return undefined
        }

        cleanUpWorkout()

        // console.debug("WorkoutStore.exerciseSummary:", self.exerciseSummary)
        const userId = user.userId
        const privateAccount = user.privateAccount
        const allExerciseSummary = yield getAllExerciseSummary(user)
        const newWorkout = {
          byUserId: userId,
          userIsPrivate: privateAccount,
          isHidden,
          startTime: self.startTime,
          endTime: self.endTime,
          exercises: allExerciseSummary,
          workoutTitle: self.workoutTitle,
          activityId: self.activityId,
          performedAtGymId: self.performedAtGymId ?? null,
          performedAtGymName: self.performedAtGymName ?? null,
        } as NewWorkout
        console.debug("WorkoutStore.saveWorkout newWorkout:", newWorkout)
        const workout = yield getEnv<RootStoreDependencies>(self).workoutRepository.create(
          newWorkout,
        )

        // IMPORTANT: Moved side effects to server side (updating user workout metadata and exercise history)

        return workout
      } catch (error) {
        console.error("WorkoutStore.saveWorkout error:", error)
        return undefined
      }
    })

    function addExercise(exercise: IExerciseModel) {
      const newExerciseOrder = self.exercises.length
      const newExercise = ExercisePerformedModel.create({
        exerciseOrder: newExerciseOrder,
        exerciseId: exercise.exerciseId,
        exerciseSource: exercise.exerciseSource,
        exerciseName: exercise.exerciseName,
        volumeType: exercise.volumeType,
        setsPerformed: [],
      })
      self.exercises.push(newExercise)
    }

    function removeExercise(exerciseOrder: number) {
      self.exercises.splice(exerciseOrder, 1)
      self.exercises.forEach((e, i) => {
        e.exerciseOrder = i
      })
    }

    function addSet(targetExerciseOrder: number, initialSetValues?: Partial<ISetPerformedModel>) {
      const exercise = self.exercises.at(targetExerciseOrder)
      if (!exercise) {
        console.error("WorkoutStore.addSet: exercise not found")
        return
      }

      const newSetOrder = exercise.setsPerformed.length
      switch (exercise.volumeType) {
        case ExerciseVolumeType.Reps:
          exercise.setsPerformed.push(
            RepsSetPerformedModel.create({
              ...initialSetValues,
              setOrder: newSetOrder,
              volumeType: exercise.volumeType,
              setType: ExerciseSetType.Normal,
              isCompleted: false,
            }),
          )
          break
        case ExerciseVolumeType.Time:
          exercise.setsPerformed.push(
            TimeSetPerformedModel.create({
              ...initialSetValues,
              setOrder: newSetOrder,
              volumeType: exercise.volumeType,
              setType: ExerciseSetType.Normal,
              isCompleted: false,
            }),
          )
          break
      }
    }

    function removeSet(targetExerciseOrder: number, targetExerciseSetOrder: number) {
      const targetExercise = self.exercises.at(targetExerciseOrder)
      if (!targetExercise) {
        console.error("WorkoutStore.removeSet: exercise not found")
        return
      }

      const sets = targetExercise.setsPerformed
      sets.splice(targetExerciseSetOrder, 1)
      sets.forEach((s, i) => {
        s.setOrder = i
      })
    }

    return {
      resetWorkout,
      cleanUpWorkout,
      setGym,
      startNewWorkout,
      pauseWorkout,
      resumeWorkout,
      endWorkout,
      saveWorkout,
      addExercise,
      removeExercise,
      addSet,
      removeSet,
    }
  })
