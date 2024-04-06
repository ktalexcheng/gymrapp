import { ActivityId } from "app/data/types/activity.types"
import { differenceInSeconds } from "date-fns"
import { randomUUID } from "expo-crypto"
import * as Notifications from "expo-notifications"
import lodash from "lodash"
import { IKeyValueMap, toJS } from "mobx"
import { SnapshotOrInstance, destroy, flow, getEnv, types } from "mobx-state-tree"
import { ExerciseSetType, ExerciseSource, ExerciseVolumeType } from "../../app/data/constants"
import { translate } from "../../app/i18n"
import { REST_TIMER_CHANNEL_ID } from "../data/constants"
import { ExercisePerformed, Gym, RepsExercisePerformed, TimeExercisePerformed } from "../data/types"
import { formatSecondsAsTime } from "../utils/formatTime"
import { IExerciseModel } from "./ExerciseStore"
import { IWorkoutSummaryModel } from "./FeedStore"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"
import {
  IRepsPersonalRecordModel,
  IRepsSetPerformedModel,
  ISetPerformedModel,
  ITimePersonalRecordModel,
  ITimeSetPerformedModel,
  IUserModel,
  IUserModelSnapshot,
  RepsSetPerformedModel,
  TimeSetPerformedModel,
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
    setsPerformed: types.array(RepsSetPerformedModel), // by default optional with [] as default value
  }),
)

const TimeExercisePerformedModel = types.compose(
  "TimeExercisePerformedModel",
  BaseExercisePerformedModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Time),
    setsPerformed: types.array(TimeSetPerformedModel), // by default optional with [] as default value
  }),
)

const ExercisePerformedModel = types.union(
  { eager: false },
  RepsExercisePerformedModel,
  TimeExercisePerformedModel,
)

const Exercises = types.array(ExercisePerformedModel)

export type IExercisePerformedModel = SnapshotOrInstance<typeof ExercisePerformedModel>

export const ActiveWorkoutStoreModel = types
  .model("ActiveWorkoutStore")
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

      for (const e of self.exercises.values()) {
        if (!e.setsPerformed.length) return false

        for (const s of e.setsPerformed) {
          if (!s.isCompleted) {
            return false
          }
        }
      }

      return true
    },
    get isEmptyWorkout() {
      // If there is at least one completed set, then the workout is not empty
      return !self.exercises.some((e) => e.setsPerformed.some((s) => s.isCompleted))
    },
    get timeElapsed() {
      if (!self.startTime) return -1

      return differenceInSeconds(new Date(), self.startTime)
    },
    get timeElapsedFormatted() {
      if (!self.startTime) return "00:00"

      const duration = differenceInSeconds(new Date(), self.startTime)
      return formatSecondsAsTime(duration, true)
    },
    get workoutDurationFormatted() {
      if (!self.startTime || !self.endTime) return "00:00:00"

      const duration = differenceInSeconds(self.endTime, self.startTime)
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
      console.debug("ActiveWorkoutStore.handleEndOfTimer called")
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
      console.debug("ActiveWorkoutStore.startRestTimer lastCompletedSet:", {
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

      console.debug("ActiveWorkoutStore.scheduleRestNotifications:", {
        seconds: self.restTime,
        channelId: REST_TIMER_CHANNEL_ID,
      })
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          priority: Notifications.AndroidNotificationPriority.MAX,
          title: translate("notification.restTime.restTimeCompletedTitle"),
          body: notificationMessage,
          data: {
            url: "gymrapp://activeWorkout",
          },
        },
        trigger: { seconds: self.restTime, repeats: false, channelId: REST_TIMER_CHANNEL_ID },
      })
    }

    const cancelRestNotifications = async () => {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId)
        console.debug("ActiveWorkoutStore.cancelRestNotifications canceled notification:", {
          notificationId,
        })

        notificationId = undefined
      }
    }

    const dismissRestNotifications = async () => {
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId)
        console.debug(
          "ActiveWorkoutStore.dismissRestNotifications dismissed presented notification:",
          {
            notificationId,
          },
        )

        notificationId = undefined
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

    function setGym(gym?: Gym) {
      if (!gym) {
        self.performedAtGymId = undefined
        self.performedAtGymName = undefined
        return
      }

      self.performedAtGymId = gym.gymId
      self.performedAtGymName = gym.gymName
    }

    const getLatestExerciseRecord = (
      userSnapshot: IUserModelSnapshot,
      exerciseId: string,
      reps: number,
      excludeWorkoutId?: string,
    ) => {
      const exerciseHistory = userSnapshot.exerciseHistory
      const exercisePersonalRecords = exerciseHistory?.[exerciseId]?.personalRecords

      let exerciseRecords = exercisePersonalRecords?.[reps]?.records
      if (excludeWorkoutId) {
        console.debug(
          "ActiveWorkoutStore.getLatestExerciseRecord() excluding workoutId:",
          excludeWorkoutId,
        )
        exerciseRecords = exerciseRecords?.filter((r) => r.workoutId !== excludeWorkoutId)
      }
      if (!exerciseRecords) {
        console.debug("ActiveWorkoutStore.getLatestExerciseRecord() no records found", {
          exerciseId,
        })
        return null
      }

      const recordsCount = exerciseRecords?.length
      const latestRecord = exerciseRecords[recordsCount - 1]

      console.debug("ActiveWorkoutStore.getLatestExerciseRecord()", { exerciseId, latestRecord })
      return latestRecord
    }

    // IMPORTANT: Note that applying toJS() to the model instances (such as exercise and set)
    // is necessary to avoid issues with MST when attemping to add the new workout to user's feed.
    // excludeWorkoutId is used to exclude the current workout from the list of personal records
    // when updating an existing workout.
    const getAllExerciseSummary = (userSnapshot: IUserModelSnapshot, excludeWorkoutId?: string) => {
      const exercisesSummary: ExercisePerformed[] = []
      const datePerformed = self.startTime ?? new Date()

      for (const e of self.exercises.values()) {
        if (e.volumeType === ExerciseVolumeType.Reps) {
          let bestSet = {} as IRepsSetPerformedModel
          const newRecords = {} as IKeyValueMap<IRepsPersonalRecordModel>
          let totalReps = 0
          let totalVolume = 0

          e.setsPerformed.forEach((s) => {
            if (!s.reps || s.reps === 0) {
              console.error("ActiveWorkoutStore.getAllExerciseSummary: Skipping set, reps is 0", {
                exercise: e,
                setsPerformed: s,
              })
              return
            }

            totalReps += s.reps
            totalVolume += (s.weight ?? 0) * s.reps

            if ((s.weight ?? 0) > (bestSet?.weight ?? -1)) {
              bestSet = toJS(s)
            }

            let latestRecord = getLatestExerciseRecord(
              userSnapshot,
              e.exerciseId,
              s.reps,
              excludeWorkoutId,
            )
            // Safety check, in case the exercise was modified and the latest record is not a reps record
            if (latestRecord?.volumeType !== ExerciseVolumeType.Reps) {
              console.debug(
                "ActiveWorkoutStore.getAllExerciseSummary: latest record is not a reps record",
                {
                  latestRecord,
                },
              )
              latestRecord = null
            }

            if ((s.weight ?? 0) > (latestRecord?.weight ?? 0)) {
              // Make sure we don't overwrite a new record with a lower weight
              if (newRecords[s.reps] && (s.weight ?? 0) < (newRecords[s.reps].weight ?? 0)) return

              newRecords[s.reps] = {
                volumeType: ExerciseVolumeType.Reps,
                datePerformed,
                weight: s.weight,
                reps: s.reps,
              }
              s.isNewRecord = true
            }
          })

          exercisesSummary.push({
            ...toJS(e),
            volumeType: ExerciseVolumeType.Reps,
            bestSet,
            datePerformed,
            totalReps,
            totalVolume,
            newRecords,
          } as RepsExercisePerformed)
        } else if (e.volumeType === ExerciseVolumeType.Time) {
          let bestSet = {} as ITimeSetPerformedModel
          const newRecords = {} as IKeyValueMap<ITimePersonalRecordModel>
          let totalTime = 0

          e.setsPerformed.forEach((s) => {
            if (!s.time || s.time === 0) {
              console.error("ActiveWorkoutStore.getAllExerciseSummary: Skipping set, time is 0", {
                exercise: e,
                setsPerformed: s,
              })
              return
            }

            totalTime += s.time

            if (s.time > (bestSet.time || 0)) {
              bestSet = toJS(s)
            }

            let latestRecord = getLatestExerciseRecord(
              userSnapshot,
              e.exerciseId,
              0,
              excludeWorkoutId,
            )
            // Safety check, in case the exercise was modified and the latest record is not a time record
            if (latestRecord?.volumeType !== ExerciseVolumeType.Time) latestRecord = null

            if (s.time > (latestRecord?.time ?? 0)) {
              // Make sure we don't overwrite a new record with a shorter time
              if (newRecords[0] && s.time < newRecords[0].time) return

              newRecords[0] = {
                reps: 0, // For time based exercises, reps is always 0
                volumeType: ExerciseVolumeType.Time,
                datePerformed,
                time: s.time,
              }
              s.isNewRecord = true
            }
          })

          exercisesSummary.push({
            ...toJS(e),
            volumeType: ExerciseVolumeType.Time,
            bestSet,
            datePerformed,
            totalTime,
            newRecords,
          } as TimeExercisePerformed)
        }
      }

      return exercisesSummary
    }

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
      self.inProgress = true
    }

    function endWorkout() {
      self.endTime = new Date()
      self.stopRestTimer()
      self.inProgress = false
    }

    const saveWorkout = flow(function* (
      isHidden: boolean,
      userSnapshot: IUserModelSnapshot,
      isOffline = false,
    ) {
      try {
        if (self.inProgress) {
          console.warn("ActiveWorkoutStore.saveWorkout: Unable to save, workout still in progress")
          return undefined
        }

        cleanUpWorkout()

        // console.debug("ActiveWorkoutStore.exerciseSummary:", self.exerciseSummary)
        const { workoutRepository } = getEnv<RootStoreDependencies>(self)
        const userId = userSnapshot.userId
        const privateAccount = userSnapshot.privateAccount
        const allExerciseSummary = getAllExerciseSummary(userSnapshot)
        const workoutId = workoutRepository.newDocumentId()
        const newWorkout = {
          workoutId,
          _createdAt: new Date(), // Repository should handle this field, but we set it here for offline use
          _modifiedAt: new Date(), // Repository should handle this field, but we set it here for offline use
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
        } as IWorkoutSummaryModel
        console.debug("ActiveWorkoutStore.saveWorkout newWorkout:", newWorkout)

        // If offline, the uploadWorkout function will save the workout locally
        const isSynced = yield workoutRepository.saveWorkout(newWorkout, isOffline)
        newWorkout.__isLocalOnly = !isSynced

        return newWorkout
      } catch (error) {
        console.error("ActiveWorkoutStore.saveWorkout error:", error)
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
        console.error("ActiveWorkoutStore.addSet: exercise not found")
        return
      }

      const newSetOrder = exercise.setsPerformed.length
      switch (exercise.volumeType) {
        case ExerciseVolumeType.Reps:
          exercise.setsPerformed.push(
            RepsSetPerformedModel.create({
              ...initialSetValues,
              setId: randomUUID(),
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
              setId: randomUUID(),
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
        console.error("ActiveWorkoutStore.removeSet: exercise not found")
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
      getAllExerciseSummary,
      saveWorkout,
      addExercise,
      removeExercise,
      addSet,
      removeSet,
    }
  })

export const WorkoutEditorStoreModel = ActiveWorkoutStoreModel.named("WorkoutEditorStore")
  .props({
    // inProgress: types.optional(types.literal(false), false),
    // restTimeRunning: types.optional(types.literal(false), false),
    originalWorkout: types.maybe(types.frozen<IWorkoutSummaryModel>()),
    workoutId: types.maybe(types.string),
    isHidden: true, // for safety, default to true
  })
  .actions((self) => {
    function hydrateWithWorkout(workout: IWorkoutSummaryModel) {
      try {
        self.originalWorkout = workout
        // self.inProgress = false
        // self.restTimeRunning = false
        self.workoutId = workout.workoutId
        self.isHidden = workout.isHidden
        self.startTime = workout.startTime
        self.endTime = workout.endTime
        self.workoutTitle = workout.workoutTitle
        self.activityId = workout.activityId
        self.performedAtGymId = workout.performedAtGymId
        self.performedAtGymName = workout.performedAtGymName
        // toJS() to convert from model instance to snapshot is necessary to avoid issues with MST
        self.exercises = toJS(workout.exercises)
      } catch (e) {
        console.error("WorkoutEditorStore.hydrateWithWorkout error:", e)
      }
    }

    const updateWorkout = flow(function* updateWorkout(
      isHidden: boolean,
      user: IUserModel,
      isOffline = false,
    ) {
      // This should not happen, but just in case
      if (!self.workoutId) {
        throw new Error("WorkoutEditorStore.updateWorkout() error: workoutId is undefined")
      }

      self.cleanUpWorkout()

      const { workoutRepository } = getEnv<RootStoreDependencies>(self)
      const privateAccount = user.privateAccount
      const allExerciseSummary = self.getAllExerciseSummary(user, self.workoutId)

      // If sets performed are modified in any way, we will flag the workout as edited
      const originalExercises = self.originalWorkout.exercises.reduce(
        (acc, e) => ({
          ...acc,
          [e.exerciseId]: {
            exerciseId: e.exerciseId,
            setsPerformed: e.setsPerformed,
          },
        }),
        {},
      )
      const updatedExercises = allExerciseSummary.reduce(
        (acc, e) => ({
          ...acc,
          [e.exerciseId]: {
            exerciseId: e.exerciseId,
            setsPerformed: e.setsPerformed,
          },
        }),
        {},
      )
      const isExerciseModified = !lodash.isEqual(toJS(originalExercises), toJS(updatedExercises))

      const updatedWorkout = {
        ...toJS(self.originalWorkout),
        _modifiedAt: new Date(), // Repository should handle this field, but we set it here for offline use
        userIsPrivate: privateAccount,
        isHidden,
        workoutTitle: self.workoutTitle,
        exercises: allExerciseSummary,
        isEdited: self.originalWorkout.isEdited || isExerciseModified, // Once a workout is edited, it remains edited
      }

      yield workoutRepository.update(self.workoutId, updatedWorkout, false, isOffline)
      return updatedWorkout
    })

    return {
      hydrateWithWorkout,
      updateWorkout,
    }
  })
