import {
  ExerciseSetType,
  ExerciseSource,
  ExerciseVolumeType,
  REST_TIMER_CHANNEL_ID,
} from "app/data/constants"
import { WorkoutTemplate } from "app/data/repository"
import {
  ActivityId,
  ExercisePerformed,
  Gym,
  RepsExercisePerformed,
  TimeExercisePerformed,
} from "app/data/types"
import { translate } from "app/i18n"
import { roundToString } from "app/utils/formatNumber"
import { formatSecondsAsTime } from "app/utils/formatTime"
import { logError } from "app/utils/logger"
import { differenceInSeconds } from "date-fns"
import { randomUUID } from "expo-crypto"
import * as Notifications from "expo-notifications"
import lodash from "lodash"
import { IKeyValueMap, toJS } from "mobx"
import {
  Instance,
  SnapshotIn,
  SnapshotOrInstance,
  destroy,
  flow,
  getEnv,
  types,
} from "mobx-state-tree"
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
  IUserModelSnapshot,
  RepsSetPerformedModel,
  SetPropType,
  TimeSetPerformedModel,
} from "./models"

const BaseExercisePerformedModel = types
  .model("BaseExercisePerformedModel", {
    exerciseOrder: types.number,
    exerciseId: types.string,
    exerciseSource: types.enumeration("ExerciseSource", Object.values(ExerciseSource)),
    exerciseName: types.string,
    exerciseNotes: types.maybeNull(types.string),
    templateExerciseNotes: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)

const RepsExercisePerformedModel = types
  .compose(
    "RepsExercisePerformedModel",
    BaseExercisePerformedModel,
    types.model({
      volumeType: types.literal(ExerciseVolumeType.Reps),
      setsPerformed: types.array(RepsSetPerformedModel), // by default optional with [] as default value
    }),
  )
  .actions((self) => {
    function addSet(initialSetValues?: Partial<ISetPerformedModel>) {
      const newSetOrder = self.setsPerformed.length
      self.setsPerformed.push(
        RepsSetPerformedModel.create({
          ...initialSetValues,
          setId: randomUUID(),
          setOrder: newSetOrder,
          volumeType: self.volumeType,
          setType: ExerciseSetType.Normal,
          isCompleted: false,
        }),
      )
    }

    return {
      addSet,
    }
  })

const TimeExercisePerformedModel = types
  .compose(
    "TimeExercisePerformedModel",
    BaseExercisePerformedModel,
    types.model({
      volumeType: types.literal(ExerciseVolumeType.Time),
      setsPerformed: types.array(TimeSetPerformedModel), // by default optional with [] as default value
    }),
  )
  .actions((self) => {
    function addSet(initialSetValues?: Partial<ISetPerformedModel>) {
      const newSetOrder = self.setsPerformed.length

      self.setsPerformed.push(
        TimeSetPerformedModel.create({
          ...initialSetValues,
          setId: randomUUID(),
          setOrder: newSetOrder,
          volumeType: self.volumeType,
          setType: ExerciseSetType.Normal,
          isCompleted: false,
        }),
      )
    }

    return {
      addSet,
    }
  })

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
    workoutNotes: types.maybeNull(types.string),
    activityId: types.maybe(types.string),
    performedAtGymId: types.maybeNull(types.string),
    performedAtGymName: types.maybeNull(types.string),
    workoutTemplateId: types.maybeNull(types.string),
    workoutTemplateNotes: types.maybeNull(types.string),
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
      // Check for any completed sets, if none, consider workout  empty
      return !self.exercises.some((e) => e.setsPerformed.some((s) => s.isCompleted))
      // return self.exercises.length === 0
    },
    get timeElapsed() {
      if (!self.startTime) return -1

      return differenceInSeconds(new Date(), self.startTime)
    },
    get timeElapsedFormatted() {
      if (!self.startTime) return "00:00:00"

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
        dismissRestNotifications()
        cancelRestNotifications()
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
            setDescription += ` ${roundToString(lastCompletedSet.weight, 2, false) ?? 0} kg`
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
          sound: "rest_time_notification.wav",
          vibrate: [0, 250, 250, 250],
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
    function cleanUpWorkout() {
      // Remove incompleted sets
      self.exercises.forEach((e) => {
        e.setsPerformed.forEach((s) => {
          !s.isCompleted && destroy(s)
        })
      })

      for (let i = 0; i < self.exercises.length; i++) {
        const e = self.exercises[i]
        if (e.setsPerformed.length === 0) {
          destroy(e)
          i-- // Decrement i to account for the removed exercise
        }
      }
    }

    function setGym(gym?: Gym) {
      if (!gym) {
        self.performedAtGymId = null
        self.performedAtGymName = null
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
      if (!exerciseHistory) {
        console.debug(
          "ActiveWorkoutStore.getLatestExerciseRecord() user exercise history unavailable",
        )
        return null
      }
      const exercisePersonalRecords = exerciseHistory.get(exerciseId)?.personalRecords

      // console.debug("ActiveWorkoutStore.getLatestExerciseRecord()", {
      //   exerciseHistory,
      //   exercisePersonalRecords,
      // })
      let exerciseRecords = exercisePersonalRecords?.get(reps.toString())?.records // MST map keys are stored internally as strings
      if (excludeWorkoutId) {
        // console.debug(
        //   "ActiveWorkoutStore.getLatestExerciseRecord() excluding workoutId:",
        //   excludeWorkoutId,
        // )
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

      // console.debug("ActiveWorkoutStore.getLatestExerciseRecord()", { exerciseId, latestRecord })
      return latestRecord
    }

    // IMPORTANT: Note that applying toJS() to the model instances (such as exercise and set) to get a snapshot
    // is necessary to avoid MST issues where model instances might be removed from the state tree.
    // excludeWorkoutId is used to exclude the current workout from the list of personal records
    // when updating an existing workout.
    const getAllExerciseSummary = (userSnapshot: IUserModelSnapshot, excludeWorkoutId?: string) => {
      // console.debug("ActiveWorkoutStore.getAllExerciseSummary", { userSnapshot })
      const exercisesSummary: ExercisePerformed[] = []
      const datePerformed = self.startTime ?? new Date()

      for (const e of self.exercises.values()) {
        if (e.volumeType === ExerciseVolumeType.Reps) {
          let bestSet = {} as IRepsSetPerformedModel
          const newRecords = {} as IKeyValueMap<IRepsPersonalRecordModel>
          let totalReps = 0
          let totalVolume = 0

          e.setsPerformed.forEach((s) => {
            s.isNewRecord = false // Reset isNewRecord flag in case we are updating an existing workout

            if (!s.reps || s.reps === 0) {
              console.warn("ActiveWorkoutStore.getAllExerciseSummary: Skipping set, reps is 0", {
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

            // Comparing with (latestRecord?.weight ?? -1) to also catch weight = 0 records
            if ((s.weight ?? 0) > (latestRecord?.weight ?? -1)) {
              // Make sure we don't overwrite a new record with a lower weight
              if (newRecords[s.reps] && (s.weight ?? 0) <= (newRecords[s.reps].weight ?? 0)) return

              newRecords[s.reps] = {
                volumeType: ExerciseVolumeType.Reps,
                datePerformed,
                weight: s.weight ?? 0,
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
            s.isNewRecord = false // Reset isNewRecord flag in case we are updating an existing workout

            if (!s.time || s.time === 0) {
              console.warn("ActiveWorkoutStore.getAllExerciseSummary: Skipping set, time is 0", {
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
              if (newRecords[0] && s.time <= newRecords[0].time) return

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

    function resetWorkout() {
      self.stopRestTimer()
      self.startTime = undefined
      self.endTime = undefined
      self.exercises = Exercises.create()
      self.inProgress = false
      self.restTime = 0
      self.restTimeStartedAt = undefined
      self.restTimeElapsed = 0
      self.restTimeRunning = false
      self.restTimeCompleted = false
      self.lastSetCompletedTime = undefined
      self.workoutTitle = translate("activeWorkoutScreen.newActiveWorkoutTitle")
      self.workoutNotes = null
      self.workoutTemplateNotes = null
      self.workoutTemplateId = null
      self.activityId = undefined
      self.performedAtGymId = null
      self.performedAtGymName = null
    }

    function startNewWorkout(activityId: ActivityId) {
      resetWorkout()
      self.startTime = new Date()
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

    // IMPORTANT: Note that applying toJS() to the model instances (such as exercise and set) to get a snapshot
    // is necessary to avoid MST issues where model instances might be removed from the state tree.
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
          workoutTitle: self.workoutTitle || translate("activeWorkoutScreen.newActiveWorkoutTitle"),
          workoutNotes: self.workoutNotes ?? null,
          activityId: self.activityId,
          performedAtGymId: self.performedAtGymId ?? null,
          performedAtGymName: self.performedAtGymName ?? null,
          workoutTemplateId: self.workoutTemplateId ?? null,
        } as IWorkoutSummaryModel
        // console.debug("ActiveWorkoutStore.saveWorkout newWorkout:", newWorkout)

        // If offline, the uploadWorkout function will save the workout locally
        const isSynced = yield workoutRepository.saveWorkout(newWorkout, isOffline)
        newWorkout.__isLocalOnly = !isSynced

        return newWorkout
      } catch (error) {
        logError(error, "ActiveWorkoutStore.saveWorkout error")
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
        console.warn("ActiveWorkoutStore.addSet: exercise not found")
        return
      }

      if (initialSetValues) {
        exercise.addSet(initialSetValues)
      } else {
        const lastSet =
          exercise.setsPerformed.length > 0 &&
          exercise.setsPerformed[exercise.setsPerformed.length - 1]
        exercise.addSet({ ...lastSet, isCompleted: false })
      }

      // const newSetOrder = exercise.setsPerformed.length
      // switch (exercise.volumeType) {
      //   case ExerciseVolumeType.Reps:
      //     exercise.setsPerformed.push(
      //       RepsSetPerformedModel.create({
      //         ...initialSetValues,
      //         setId: randomUUID(),
      //         setOrder: newSetOrder,
      //         volumeType: exercise.volumeType,
      //         setType: ExerciseSetType.Normal,
      //         isCompleted: false,
      //       }),
      //     )
      //     break
      //   case ExerciseVolumeType.Time:
      //     exercise.setsPerformed.push(
      //       TimeSetPerformedModel.create({
      //         ...initialSetValues,
      //         setId: randomUUID(),
      //         setOrder: newSetOrder,
      //         volumeType: exercise.volumeType,
      //         setType: ExerciseSetType.Normal,
      //         isCompleted: false,
      //       }),
      //     )
      //     break
      // }
    }

    function removeSet(targetExerciseOrder: number, targetExerciseSetOrder?: number) {
      const targetExercise = self.exercises.at(targetExerciseOrder)
      if (!targetExercise) {
        console.warn("ActiveWorkoutStore.removeSet: exercise not found")
        return
      }

      if (targetExerciseSetOrder === undefined) {
        targetExercise.setsPerformed.clear()
      } else {
        const sets = targetExercise.setsPerformed
        sets.splice(targetExerciseSetOrder, 1)
        sets.forEach((s, i) => {
          s.setOrder = i
        })
      }
    }

    function updateExercise(
      exerciseOrder: number,
      prop: keyof SnapshotIn<typeof ExercisePerformedModel>,
      value: any,
    ) {
      const exercise = self.exercises[exerciseOrder]
      if (!exercise) {
        console.warn("ActiveWorkoutStore.updateExercise: exercise not found")
        return
      }

      exercise.setProp(prop as any, value)
    }

    function updateSetValues(
      exerciseOrder: number,
      setOrder: number,
      prop: SetPropType | "isCompleted",
      value: number | boolean | null,
    ) {
      const exercise = self.exercises[exerciseOrder]
      if (!exercise) {
        console.warn("ActiveWorkoutStore.updateSetValues: exercise not found")
        return
      }

      const set = exercise.setsPerformed[setOrder]
      if (!set) {
        console.warn("ActiveWorkoutStore.updateSetValues: set not found")
        return
      }

      if (prop === "isCompleted") {
        set.setProp("isCompleted", value as boolean)
      } else {
        set.updateSetValues(prop, value)
      }
    }

    function hydrateWithTemplate(template: WorkoutTemplate) {
      try {
        self.workoutTitle = template.workoutTemplateName
        self.workoutTemplateNotes = template.workoutTemplateNotes ?? null
        self.activityId = template.activityId
        self.workoutTemplateId = template.workoutTemplateId
        template.exercises.forEach((e) => {
          // toJS() to convert from model instance to snapshot is necessary to avoid issues with MST
          addExercise(toJS(e) as any)

          e.sets.forEach((s) => {
            // @ts-ignore: It works, don't want to handle the type issue and we can guarantee the template is the right typ
            addSet(e.exerciseOrder, toJS(s))
          })

          self.exercises
            .at(e.exerciseOrder)
            ?.setProp("templateExerciseNotes", e.templateExerciseNotes ?? null)
        })
      } catch (e) {
        logError(e, "WorkoutEditorStore.hydrateWithTemplate error")
      }
    }

    function reorderExercise(fromIndex: number, toIndex: number) {
      // Create a copy and move element in array
      const from = self.exercises.at(fromIndex)
      // @ts-ignore: It works, but TS doesn't like it
      const exercisesCopy = self.exercises.toSpliced(fromIndex, 1).toSpliced(toIndex, 0, from)

      // Update exerciseOrder
      exercisesCopy.forEach((e, i) => {
        e.exerciseOrder = i
      })

      // @ts-ignore: It works, but TS doesn't like it
      self.exercises = exercisesCopy
    }

    function replaceExercise(exerciseOrder: number, newExercise: IExerciseModel) {
      const targetExercise = self.exercises[exerciseOrder]
      if (!targetExercise) {
        console.warn("ActiveWorkoutStore.replaceExercise: exercise not found")
        return
      }

      const newExercisePerformed = ExercisePerformedModel.create({
        exerciseOrder,
        exerciseId: newExercise.exerciseId,
        exerciseSource: newExercise.exerciseSource,
        exerciseName: newExercise.exerciseName,
        volumeType: newExercise.volumeType,
        setsPerformed: [],
      })

      // Create empty sets for the new exercise
      for (let i = 0; i < targetExercise.setsPerformed.length; i++) {
        newExercisePerformed.addSet()
      }

      self.exercises.splice(exerciseOrder, 1, newExercisePerformed)
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
      updateExercise,
      updateSetValues,
      hydrateWithTemplate,
      reorderExercise,
      replaceExercise,
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
        self.workoutNotes = workout.workoutNotes
        self.activityId = workout.activityId
        self.performedAtGymId = workout.performedAtGymId
        self.performedAtGymName = workout.performedAtGymName
        // toJS() to convert from model instance to snapshot is necessary to avoid issues with MST
        self.exercises = toJS(workout.exercises)
      } catch (e) {
        logError(e, "WorkoutEditorStore.hydrateWithWorkout error")
      }
    }

    const checkIsExerciseModified = (
      user: IUserModelSnapshot,
      newAllExerciseSummary: ExercisePerformed[],
    ) => {
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
      const updatedExercises = newAllExerciseSummary.reduce(
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

      return isExerciseModified
    }

    const updateWorkout = flow(function* updateWorkout(
      isHidden: boolean,
      user: IUserModelSnapshot,
      updatePersonalRecords = false,
      isOffline = false,
    ) {
      // console.debug("WorkoutEditorStore.updateWorkout called", { user })
      // This should not happen, but just in case
      if (!self.workoutId) {
        logError("WorkoutEditorStore.updateWorkout() error: workoutId is undefined")
        return Promise.reject(
          new Error("WorkoutEditorStore.updateWorkout() error: workoutId is undefined"),
        )
      }

      self.cleanUpWorkout()
      const allExerciseSummary = self.getAllExerciseSummary(user, self.workoutId)
      const isExerciseModified = checkIsExerciseModified(user, allExerciseSummary)
      const privateAccount = user.privateAccount

      const updatedWorkout = {
        ...toJS(self.originalWorkout),
        _modifiedAt: new Date(), // Repository should handle this field, but we set it here for offline use
        userIsPrivate: privateAccount,
        isHidden,
        workoutTitle: self.workoutTitle || translate("activeWorkoutScreen.newActiveWorkoutTitle"),
        exercises: allExerciseSummary,
        isEdited: self.originalWorkout.isEdited || isExerciseModified, // Once a workout is edited, it remains edited
      }

      const { workoutRepository } = getEnv<RootStoreDependencies>(self)
      if (updatePersonalRecords) {
        yield workoutRepository.saveWorkout(updatedWorkout, isOffline)
      } else {
        yield workoutRepository.update(self.workoutId, updatedWorkout, false, isOffline)
      }

      return updatedWorkout
    })

    return {
      hydrateWithWorkout,
      checkIsExerciseModified,
      updateWorkout,
    }
  })

export interface IActiveWorkoutStoreModel extends Instance<typeof ActiveWorkoutStoreModel> {}
export interface IWorkoutEditorStoreModel extends Instance<typeof WorkoutEditorStoreModel> {}
