import firestore from "@react-native-firebase/firestore"
import {
  ExerciseSource,
  ExerciseVolumeType,
  ReportAbuseTypes,
  WorkoutSource,
} from "app/data/constants"
import { FirebaseSnapshotType } from "app/data/repository"
import { CommentId, ExerciseId, UserId, WorkoutComment, WorkoutId } from "app/data/types"
import { api } from "app/services/api"
import { getNestedField } from "app/utils/getNestedField"
import { logError } from "app/utils/logger"
import { getTime, milliseconds, startOfDay, startOfWeek } from "date-fns"
import { randomUUID } from "expo-crypto"
import { toJS } from "mobx"
import { Instance, SnapshotOrInstance, flow, getEnv, types } from "mobx-state-tree"
import { convertUserToMSTSnapshot } from "./helpers/convertUserToMSTSnapshot"
import { convertWorkoutToMSTSnapshot } from "./helpers/convertWorkoutToMSTSnapshot"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"
import {
  IUserModel,
  MetadataModel,
  PersonalRecordModel,
  RepsPersonalRecordModel,
  RepsSetPerformedModel,
  SetPerformedModel,
  TimePersonalRecordModel,
  TimeSetPerformedModel,
  UserModel,
  WorkoutMetaModel,
} from "./models"

const BaseExerciseSummaryModel = types.model("BaseExerciseSummaryModel", {
  exerciseId: types.string,
  exerciseSource: types.enumeration("ExerciseSource", Object.values(ExerciseSource)),
  exerciseName: types.string,
  exerciseOrder: types.number,
  setsPerformed: types.array(SetPerformedModel),
  datePerformed: types.Date,
  bestSet: SetPerformedModel,
  newRecords: types.map(PersonalRecordModel),
  exerciseNotes: types.maybeNull(types.string),
})

const RepsExerciseSummaryModel = types.compose(
  "RepsExerciseSummaryModel",
  BaseExerciseSummaryModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Reps),
    totalVolume: types.number,
    totalReps: types.number,
    bestSet: RepsSetPerformedModel,
    setsPerformed: types.array(RepsSetPerformedModel),
    newRecords: types.map(RepsPersonalRecordModel),
  }),
)

const TimeExerciseSummaryModel = types.compose(
  "TimeExerciseSummaryModel",
  BaseExerciseSummaryModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Time),
    totalTime: types.number,
    bestSet: TimeSetPerformedModel,
    setsPerformed: types.array(TimeSetPerformedModel),
    newRecords: types.map(TimePersonalRecordModel),
  }),
)

export const ExerciseSummaryModel = types.union(
  { eager: true },
  RepsExerciseSummaryModel,
  TimeExerciseSummaryModel,
)

export const WorkoutSummaryModel = types.snapshotProcessor(
  types.compose(
    "WorkoutSummaryModel",
    MetadataModel,
    types.model({
      workoutId: types.identifier,
      isEdited: false,
      byUserId: types.string,
      userIsPrivate: types.boolean,
      isHidden: types.boolean,
      startTime: types.Date,
      endTime: types.Date,
      exercises: types.array(ExerciseSummaryModel),
      workoutTitle: types.string,
      workoutNotes: types.maybeNull(types.string),
      activityId: types.string,
      performedAtGymId: types.maybeNull(types.string),
      performedAtGymName: types.maybeNull(types.string),
    }),
  ),
  {
    preProcessor: (snapshot: any) => {
      if (snapshot.isMSTInterface) return snapshot

      try {
        return convertWorkoutToMSTSnapshot(snapshot)
      } catch {
        return snapshot
      }
    },
    postProcessor: (snapshot) => {
      return { ...snapshot, isMSTInterface: true }
    },
  },
)

const WorkoutCommentModel = types.compose(
  "WorkoutCommentModel",
  MetadataModel,
  types.model({
    commentId: types.identifier,
    byUserId: types.string,
    comment: types.string,
  }),
)

const convertWorkoutInteractionToMSTSnapshot = (snapshot: any) => {
  const converted = { ...snapshot }

  if (converted?.reportedCommentIds) {
    const reportedCommentIds = {}
    for (const [commentId, count] of Object.entries(converted.reportedCommentIds)) {
      reportedCommentIds[commentId] = {
        commentId,
        count,
      }
    }
    converted.reportedCommentIds = reportedCommentIds
  }

  return converted
}

const _WorkoutInteractionModel = types
  .model("WorkoutInteractionModel", {
    workoutId: types.identifier,
    workoutByUserId: types.string,
    likedByUserIds: types.array(types.string),
    comments: types.array(WorkoutCommentModel),
    reportedCommentIds: types.map(
      types.model({
        commentId: types.identifier,
        count: types.number,
      }),
    ),
  })
  .actions((self) => ({
    addComment(workoutComment: IWorkoutCommentModel) {
      self.comments.push(workoutComment)
    },
    removeComment(workoutComment: Instance<typeof WorkoutCommentModel>) {
      self.comments.remove(workoutComment)
    },
    addLike(likedByUserId: string) {
      self.likedByUserIds.push(likedByUserId)
    },
    removeLike(likedByUserId: string) {
      self.likedByUserIds.remove(likedByUserId)
    },
  }))

const WorkoutInteractionModel = types.snapshotProcessor(_WorkoutInteractionModel, {
  preProcessor: (snapshot: any) => {
    if (snapshot.isMSTInterface) return snapshot

    try {
      return convertWorkoutInteractionToMSTSnapshot(snapshot)
    } catch {
      return snapshot
    }
  },
  postProcessor: (snapshot) => {
    return { ...snapshot, isMSTInterface: true }
  },
})

export type IRepsExerciseSummaryModel = SnapshotOrInstance<typeof RepsExerciseSummaryModel>
export type ITimeExerciseSummaryModel = SnapshotOrInstance<typeof TimeExerciseSummaryModel>
export type IExerciseSummaryModel = IRepsExerciseSummaryModel | ITimeExerciseSummaryModel
export type IWorkoutSummaryModel = SnapshotOrInstance<typeof WorkoutSummaryModel>
export type IWorkoutCommentModel = SnapshotOrInstance<typeof WorkoutCommentModel>
export type IWorkoutInteractionModel = SnapshotOrInstance<typeof WorkoutInteractionModel>

/**
 * To distinguish user's own workouts and feed workouts, we use two separate fields
 * for storing workouts. User's own workouts are stored in userWorkouts and feed
 * workouts are stored in feedWorkouts. There is no need to do the same with
 * workout interactions to reduce complexity.
 */
export const FeedStoreModel = types
  .model("FeedStoreModel")
  .props({
    lastFeedRefresh: types.maybe(types.Date),
    userId: types.maybeNull(types.string),
    blockedUserIds: types.array(types.string),
    oldestFeedItemId: types.maybe(types.string),
    noMoreFeedItems: false,
    workoutInteractions: types.map(WorkoutInteractionModel),
    workouts: types.map(WorkoutSummaryModel),
    userWorkoutMetas: types.array(WorkoutMetaModel),
    feedWorkoutMetas: types.array(WorkoutMetaModel),
    otherUserProfiles: types.map(UserModel),
    otherUserMetas: types.map(
      types.model("OtherUserMetasModel", {
        byUserId: types.identifier,
        lastWorkoutId: types.maybeNull(types.string),
        noMoreItems: types.boolean,
        workoutMetas: types.array(WorkoutMetaModel),
      }),
    ),
  })
  .volatile(() => ({
    isLoadingFeed: false,
    isLoadingUserWorkouts: false,
    isLoadingOtherUserWorkouts: false,
  }))
  .views((self) => {
    function getAllWorkoutMetas(workoutSource: WorkoutSource, otherUserId?: UserId) {
      let workoutMetas
      switch (workoutSource) {
        case WorkoutSource.User:
          workoutMetas = self.userWorkoutMetas
          break
        case WorkoutSource.Feed:
          workoutMetas = self.feedWorkoutMetas
          break
        case WorkoutSource.OtherUser:
          if (!otherUserId) {
            logError("getWorkoutsListData: otherUserId is required for WorkoutSource.OtherUser")
            throw new Error(
              "getWorkoutsListData: otherUserId is required for WorkoutSource.OtherUser",
            )
          }
          workoutMetas = self.otherUserMetas.get(otherUserId)?.workoutMetas
          break
      }

      return workoutMetas ?? []
    }

    function getAllWorkouts(workoutSource: WorkoutSource, otherUserId?: UserId) {
      const workoutMetas = getAllWorkoutMetas(workoutSource, otherUserId)
      return workoutMetas
        .map((w) => self.workouts.get(w.workoutId))
        .filter((w) => w !== undefined)
        .sort((a, b) => b?.startTime?.getTime() - a?.startTime?.getTime())
    }

    function getAllWorkoutsListData(workoutSource: WorkoutSource, otherUserId?: UserId) {
      const workoutMetas = getAllWorkoutMetas(workoutSource, otherUserId)
      const workouts = workoutMetas
        .map((w) => {
          const workout = self.workouts.get(w.workoutId)
          if (!workout) return undefined

          return {
            workoutId: workout.workoutId,
            workoutSource,
            workout,
            byUser: self.otherUserProfiles.get(workout.byUserId),
          }
        })
        .filter((w) => w !== undefined)
        .filter(
          (w) =>
            workoutSource === WorkoutSource.User || self.otherUserProfiles.has(w.workout.byUserId),
        )
        .filter((w) => !self.blockedUserIds.includes(w?.byUser?.userId))
        .sort((a, b) => b.workout.startTime.getTime() - a.workout.startTime.getTime())

      return workouts
    }

    return {
      get weeklyWorkoutsCount() {
        const _weeklyWorkoutsCount = new Map<number, number>()
        if (self.userWorkoutMetas.length === 0) return _weeklyWorkoutsCount

        const workouts = Array.from(self.userWorkoutMetas.values())
        workouts.forEach((w) => {
          // Find start of week (Monday)
          const weekStart = startOfWeek(new Date(w.startTime), {
            weekStartsOn: 1,
          })
          const weekStartMs = getTime(weekStart)

          if (!_weeklyWorkoutsCount.has(weekStartMs)) {
            _weeklyWorkoutsCount.set(weekStartMs, 1)
          } else {
            _weeklyWorkoutsCount.set(weekStartMs, (_weeklyWorkoutsCount.get(weekStartMs) ?? 0) + 1)
          }
        })

        // Fill out missing weeks
        const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
        const currentWeekMs = getTime(currentWeek)
        const minWeekMs = Math.min(...Array.from(_weeklyWorkoutsCount.keys()))

        for (let i = minWeekMs; i <= currentWeekMs; i += milliseconds({ weeks: 1 })) {
          const _weekMs = getTime(startOfDay(i))
          if (!_weeklyWorkoutsCount.has(_weekMs)) {
            // Wrapping startOfday(i) to avoid timezone issues from date-fns
            // for example daylight saving time issues in applicable time zones
            _weeklyWorkoutsCount.set(_weekMs, 0)
          }
        }

        return _weeklyWorkoutsCount
      },
      get userWorkouts() {
        return getAllWorkouts(WorkoutSource.User)
      },
      get userWorkoutsListData() {
        return getAllWorkoutsListData(WorkoutSource.User)
      },
      get feedListData() {
        return getAllWorkoutsListData(WorkoutSource.Feed)
      },
      get feedStoreIsBusy() {
        console.debug("FeedStore.feedStoreIsBusy called", {
          isLoadingFeed: self.isLoadingFeed,
          isLoadingUserWorkouts: self.isLoadingUserWorkouts,
          isLoadingOtherUserWorkouts: self.isLoadingOtherUserWorkouts,
        })
        return self.isLoadingUserWorkouts || self.isLoadingFeed || self.isLoadingOtherUserWorkouts
      },
      getWorkout(workoutId: string) {
        if (self.isLoadingUserWorkouts || self.isLoadingFeed || self.isLoadingOtherUserWorkouts) {
          console.debug("FeedStore.getWorkout loading workouts")
          return undefined
        }

        const workout = self.workouts.get(workoutId)
        return toJS(workout)
      },
      getSetFromWorkout(workoutId: WorkoutId, exerciseId: ExerciseId, setOrder: number) {
        console.debug("FeedStore.getSetFromWorkout() workoutId:", workoutId)
        const latestWorkout = self.workouts.get(workoutId)
        if (!latestWorkout) return null

        console.debug("FeedStore.getSetFromWorkout() latestWorkout:", latestWorkout)
        const lastPerformedSet = latestWorkout.exercises.filter(
          (e) => e.exerciseId === exerciseId,
        )[0]?.setsPerformed?.[setOrder]
        if (!lastPerformedSet) return null

        console.debug("FeedStore.getSetFromWorkout() lastPerformedSet:", lastPerformedSet)
        return lastPerformedSet
      },
      getInteractionsForWorkout(workoutId: string) {
        if (self.isLoadingUserWorkouts || self.isLoadingFeed || self.isLoadingOtherUserWorkouts) {
          console.debug("FeedStore.getInteractionsForWorkout loading workouts")
          return null
        }

        const interactions = self.workoutInteractions.get(workoutId) ?? null
        return toJS(interactions)
      },
      getOtherUserWorkoutsListData(otherUserId: UserId) {
        return getAllWorkoutsListData(WorkoutSource.OtherUser, otherUserId)
      },
      isUserBlocked(userId: UserId) {
        return self.blockedUserIds.includes(userId)
      },
      isCommentFlagged(workoutId: WorkoutId, commentId: CommentId) {
        const interactions = self.workoutInteractions.get(workoutId)
        const reportedCount = interactions?.reportedCommentIds?.get(commentId)?.count ?? 0
        return reportedCount > 0
      },
    }
  })
  .actions(withSetPropAction)
  .actions((self) => {
    function checkInitialized() {
      if (!self.userId) {
        console.warn("FeedStore is not initialized with userId")
        return false
      }
      return true
    }

    function initializeWithUserId(userId: UserId) {
      self.userId = userId

      const { userRepository } = getEnv<RootStoreDependencies>(self)
      userRepository.getAllBlockedUsers().then((blockedUsers) => {
        self.setProp("blockedUserIds", blockedUsers)
      })
    }

    function resetFeed() {
      self.userId = null
      self.isLoadingFeed = false
      self.isLoadingUserWorkouts = false
      self.isLoadingOtherUserWorkouts = false
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.workouts.clear()
      self.workoutInteractions.clear()
      self.userWorkoutMetas.clear()
      self.feedWorkoutMetas.clear()
      self.otherUserProfiles.clear()
      self.otherUserMetas.clear()
    }

    function addWorkoutToStore(workoutSource: WorkoutSource, ...workouts: IWorkoutSummaryModel[]) {
      for (const workout of workouts) {
        try {
          self.workouts.put(workout)
          const workoutMeta = {
            workoutId: workout.workoutId,
            startTime: workout.startTime,
          }
          let workoutMetas
          switch (workoutSource) {
            case WorkoutSource.User:
              // self.userWorkoutMetas.push(workoutMeta)
              workoutMetas = self.userWorkoutMetas
              break
            case WorkoutSource.Feed:
              // self.feedWorkoutMetas.push(workoutMeta)
              workoutMetas = self.feedWorkoutMetas
              break
            case WorkoutSource.OtherUser:
              // self.otherUserMetas.get(workout.byUserId)?.workoutMetas?.push(workoutMeta)
              workoutMetas = self.otherUserMetas.get(workout.byUserId)?.workoutMetas
              if (!workoutMetas) {
                self.otherUserMetas.put({
                  byUserId: workout.byUserId,
                  workoutMetas: [],
                  lastWorkoutId: null,
                  noMoreItems: false,
                })
                workoutMetas = self.otherUserMetas.get(workout.byUserId)?.workoutMetas
              }
              break
          }

          const existingWorkoutMeta = workoutMetas.find((w) => w.workoutId === workout.workoutId)
          if (existingWorkoutMeta) {
            existingWorkoutMeta.startTime = workout.startTime
          } else {
            workoutMetas.push(workoutMeta)
          }
        } catch (e) {
          logError(e, "FeedStore.addWorkout error", { workout })
        }
      }
    }

    const refreshWorkout = flow(function* (workoutSource: WorkoutSource, workoutId: WorkoutId) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      try {
        let workout
        if (workoutSource === WorkoutSource.User) {
          workout = yield workoutRepository.get(workoutId, true)
        } else {
          workout = yield api.getOtherUserWorkout(workoutId)
        }
        console.debug("FeedStore.refreshWorkout() ", { workout })
        addWorkoutToStore(workoutSource, workout)
      } catch (e) {
        logError(e, "FeedStore.refreshWorkout error")
      }
    })

    const loadUserWorkouts = flow(function* () {
      console.debug("FeedStore.loadUserWorkouts called")
      if (!checkInitialized() || !self.userId) return undefined

      try {
        self.isLoadingUserWorkouts = true

        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const user = yield userRepository.get(self.userId, true)
        const workoutMetasMap = getNestedField(user, "workoutMetas")
        const workoutIds = workoutMetasMap && Object.keys(workoutMetasMap)

        if (!workoutMetasMap || !workoutIds || workoutIds.length === 0) {
          console.debug("FeedStore.loadUserWorkouts empty workoutMetas")
          return
        }

        const { workoutRepository, workoutInteractionRepository } =
          getEnv<RootStoreDependencies>(self)
        const workouts: IWorkoutSummaryModel[] = yield workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("FeedStore.loadUserWorkouts no workouts found")
          return
        }

        const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
        workoutInteractions.forEach((interaction) => {
          self.workoutInteractions.put({
            workoutId: interaction.workoutId,
            workoutByUserId: interaction.workoutByUserId,
            likedByUserIds: interaction.likedByUserIds,
            comments: interaction.comments,
          })
        })

        // Load local user workouts
        const localWorkouts = yield workoutRepository.getAllLocalWorkouts()

        // Do this very last so the user can still see workouts while loading
        self.userWorkoutMetas.clear()
        addWorkoutToStore(WorkoutSource.User, ...workouts)
        addWorkoutToStore(WorkoutSource.User, ...localWorkouts)

        console.debug("FeedStore.loadUserWorkouts done")
      } catch (e) {
        logError(e, "FeedStore.loadUserWorkouts error")
      } finally {
        self.isLoadingUserWorkouts = false
      }
    })

    const deleteWorkout = flow(function* (workoutId: WorkoutId) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      try {
        yield workoutRepository.delete(workoutId)
        self.workouts.delete(workoutId)
        const workoutMeta = self.userWorkoutMetas.find((w) => w.workoutId === workoutId)
        if (workoutMeta) {
          console.debug("FeedStore.deleteWorkout() removing from userWorkoutMetas", { workoutMeta })
          self.userWorkoutMetas.remove(workoutMeta)
        }
      } catch (e) {
        logError(e, "FeedStore.deleteWorkout error")
      }
    })

    function updateWorkoutInteractions(workoutInteractions: IWorkoutInteractionModel) {
      try {
        self.workoutInteractions.put(workoutInteractions)
      } catch (e) {
        logError(e, "FeedStore.updateWorkoutInteractions error")
      }
    }

    const fetchUserProfileToStore = flow(function* (userId: UserId) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      if (!self.otherUserProfiles.has(userId)) {
        let user
        try {
          user = yield userRepository.get(userId)
          if (!user) return null

          const userSnapshot = convertUserToMSTSnapshot(user)
          self.otherUserProfiles.put(userSnapshot)
        } catch (e) {
          logError(e, "FeedStore.fetchUserProfileToStore error", { userId, user })
        }
      }

      const userProfile = self.otherUserProfiles.get(userId)
      return userProfile
    })

    const loadMoreFeedItems = flow(function* () {
      console.debug("FeedStore.loadMoreFeedItems called")
      if (!checkInitialized()) return undefined
      if (self.noMoreFeedItems) return undefined

      self.isLoadingFeed = true
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)

      try {
        const { lastFeedItemId, noMoreItems, workouts } = yield api.getFeedWorkouts(
          self.oldestFeedItemId,
        )
        self.oldestFeedItemId = lastFeedItemId === null ? undefined : lastFeedItemId
        self.noMoreFeedItems = noMoreItems
        const workoutIds = workouts.map((w) => w.workoutId)
        addWorkoutToStore(WorkoutSource.Feed, ...workouts)
        const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
        for (const interaction of workoutInteractions) {
          self.workoutInteractions.put(interaction)
        }

        const feedUserIds = new Set<string>(workouts.map((w) => w.byUserId))
        for (const feedUserId of feedUserIds) {
          yield fetchUserProfileToStore(feedUserId)
        }

        return workouts
      } catch (e) {
        logError(e, "FeedStore.loadMoreFeedItems error")
      } finally {
        self.isLoadingFeed = false
      }

      return []
    })

    const addCommentToWorkout = flow(function* (
      workoutId: WorkoutId,
      commentByUserId: UserId,
      comment: string,
    ) {
      const workout = self.workouts.get(workoutId)
      if (!workout) {
        logError(new Error("FeedStore.likeWorkout workout not found"), { workoutId })
        return
      }
      const workoutByUserId = workout.byUserId

      // Nested FieldValue.serverTimestamp() in arrayUnion() is not supported
      // so we use the client timestamp instead, should be good enough for this case
      const newComment = {
        commentId: randomUUID(),
        byUserId: commentByUserId,
        comment,
        _createdAt: new Date(),
      } as WorkoutComment

      try {
        if (!self.workoutInteractions.has(workoutId)) {
          self.workoutInteractions.put({
            workoutId,
            workoutByUserId,
            likedByUserIds: [],
            comments: [],
          })
        }
        const interactions = self.workoutInteractions.get(workoutId)
        interactions?.addComment(newComment)

        const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
        yield workoutInteractionRepository.upsert(workoutId, {
          workoutId,
          workoutByUserId,
          comments: firestore.FieldValue.arrayUnion(newComment),
        })
      } catch (e) {
        logError(e, "FeedStore.addCommentToWorkout error")
      }
    })

    const removeCommentFromWorkout = flow(function* (workoutId: WorkoutId, commentId: CommentId) {
      try {
        const interactions = self.workoutInteractions.get(workoutId)
        const commentToDelete = interactions?.comments.find((c) => c.commentId === commentId)
        const commentToDeleteAsJS = toJS(commentToDelete) // Get the snapshot before removing
        commentToDelete && interactions?.removeComment(commentToDelete)

        const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
        yield workoutInteractionRepository.update(
          workoutId,
          {
            comments: firestore.FieldValue.arrayRemove({
              _createdAt: commentToDeleteAsJS?._createdAt,
              byUserId: commentToDeleteAsJS?.byUserId,
              comment: commentToDeleteAsJS?.comment,
              commentId: commentToDeleteAsJS?.commentId,
            }),
          },
          false,
        )
      } catch (e) {
        logError(e, "FeedStore.removeCommentFromWorkout error")
      }
    })

    const likeWorkout = flow(function* (workoutId: WorkoutId, likedByUserId: UserId) {
      try {
        const workout = self.workouts.get(workoutId)
        if (!workout) {
          logError(new Error("FeedStore.likeWorkout workout not found"), { workoutId })
          return
        }
        const workoutByUserId = workout.byUserId

        if (!self.workoutInteractions.has(workoutId)) {
          self.workoutInteractions.put({
            workoutId,
            workoutByUserId,
            likedByUserIds: [],
            comments: [],
          })
        }
        const interactions = self.workoutInteractions.get(workoutId)
        interactions?.addLike(likedByUserId)

        const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
        yield workoutInteractionRepository.upsert(workoutId, {
          workoutId,
          workoutByUserId,
          likedByUserIds: firestore.FieldValue.arrayUnion(likedByUserId),
        })
      } catch (e) {
        logError(e, "FeedStore.likeWorkout error")
      }
    })

    const unlikeWorkout = flow(function* (workoutId: WorkoutId, byUserId: UserId) {
      try {
        const interactions = self.workoutInteractions.get(workoutId)
        interactions?.removeLike(byUserId)

        const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
        yield workoutInteractionRepository.update(
          workoutId,
          {
            likedByUserIds: firestore.FieldValue.arrayRemove(byUserId),
          },
          false,
        )
      } catch (e) {
        logError(e, "FeedStore.unlikeWorkout error")
      }
    })

    const refreshFeedItems = flow(function* () {
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.feedWorkoutMetas.clear()
      // TODO: Clear other user profiles after a while
      yield loadMoreFeedItems()
      self.lastFeedRefresh = new Date()
    })

    const loadMoreOtherUserWorkouts = flow(function* (otherUserId: UserId) {
      if (self.isLoadingOtherUserWorkouts) return undefined

      const otherUserWorkouts = self.otherUserMetas.get(otherUserId)
      const lastFeedItemId = otherUserWorkouts
        ? self.otherUserMetas.get(otherUserId)?.lastWorkoutId
        : undefined
      const noMoreItems = otherUserWorkouts
        ? self.otherUserMetas.get(otherUserId)?.noMoreItems
        : false

      if (noMoreItems) return undefined

      try {
        console.debug("FeedStore.loadMoreOtherUserWorkouts running")
        self.isLoadingOtherUserWorkouts = true

        const {
          lastWorkoutId: newLastWorkoutId,
          noMoreItems: newNoMoreItems,
          workouts: newWorkouts,
        } = yield api.getOtherUserWorkouts(otherUserId, lastFeedItemId ?? undefined)

        if (otherUserWorkouts) {
          otherUserWorkouts.lastWorkoutId = newLastWorkoutId
          otherUserWorkouts.noMoreItems = newNoMoreItems
        } else {
          self.otherUserMetas.put({
            byUserId: otherUserId,
            lastWorkoutId: newLastWorkoutId,
            noMoreItems: newNoMoreItems,
            workoutMetas: newWorkouts.map((w) => ({
              workoutId: w.workoutId,
              startTime: w.startTime,
            })),
          })
        }

        addWorkoutToStore(WorkoutSource.OtherUser, ...newWorkouts)
      } catch (e) {
        logError(e, "FeedStore.loadMoreOtherUserWorkouts error")
      } finally {
        self.isLoadingOtherUserWorkouts = false
      }
    })

    const refreshOtherUserWorkouts = flow(function* (otherUserId: UserId) {
      console.debug("FeedStore.refreshOtherUserWorkouts called")
      // TODO: Clear other user's workouts from self.workouts
      self.otherUserMetas.delete(otherUserId)
      yield loadMoreOtherUserWorkouts(otherUserId)
    })

    const syncLocalUserWorkouts = flow(function* () {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)
      const uploadedWorkoutIds = yield workoutRepository.uploadAllLocalWorkouts()

      // update __isLocalOnly to false
      for (const workoutId of uploadedWorkoutIds) {
        const workout = self.workouts.get(workoutId)
        if (workout) {
          workout.__isLocalOnly = false
          self.workouts.put(workout)
        }
      }

      return uploadedWorkoutIds
    })

    const blockUser = flow(function* (userIdToBlock: UserId) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.blockUser(userIdToBlock)
        self.blockedUserIds.push(userIdToBlock)
      } catch (e) {
        logError(e, "FeedStore.blockUser error")
      }
    })

    const unblockUser = flow(function* (userIdToUnblock: UserId) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.unblockUser(userIdToUnblock)
        self.blockedUserIds.remove(userIdToUnblock)
      } catch (e) {
        logError(e, "FeedStore.unblockUser error")
      }
    })

    const reportComment = flow(function* (
      workoutId: WorkoutId,
      comment: IWorkoutCommentModel,
      reasons: ReportAbuseTypes[],
      otherReason?: string,
    ) {
      const { feedRepository, workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield feedRepository.reportComment(
          workoutId,
          {
            commentId: comment.commentId,
            byUserId: comment.byUserId,
            comment: comment.comment,
          },
          reasons,
          otherReason,
        )

        yield workoutInteractionRepository.update(workoutId, {
          [`reportedCommentIds.${comment.commentId}`]: firestore.FieldValue.increment(1),
        })
      } catch (e) {
        logError(e, "FeedStore.reportComment error")
      }
    })

    const reportUser = flow(function* (
      userId: UserId,
      reasons: ReportAbuseTypes[],
      otherReason?: string,
    ) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        yield userRepository.reportUser(userId, reasons, otherReason)
      } catch (e) {
        logError(e, "FeedStore.reportUser error")
      }
    })

    const getMoreUserFollowers = flow(function* (
      userId: string,
      lastUserFollowerDoc?: FirebaseSnapshotType,
    ) {
      const userProfiles: IUserModel = []
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        const { ids, hasMore, lastDocSnapshot } = yield userRepository.getAllUserFollowers(
          userId,
          lastUserFollowerDoc,
        )

        for (const id of ids) {
          yield fetchUserProfileToStore(id).then((profile) => profile && userProfiles.push(profile))
        }

        return { userProfiles, hasMore, lastDocSnapshot }
      } catch (e) {
        logError(e, "UserStore.getAllUserFollowers error")
      }

      return { userProfiles: [], hasMore: false, lastDocSnapshot: null }
    })

    const getMoreUserFollowing = flow(function* (
      userId: string,
      lastUserFollowingDoc?: FirebaseSnapshotType,
    ) {
      const userProfiles: IUserModel = []
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      try {
        const { ids, hasMore, lastDocSnapshot } = yield userRepository.getAllUserFollowing(
          userId,
          lastUserFollowingDoc,
        )

        for (const id of ids) {
          yield fetchUserProfileToStore(id).then((profile) => profile && userProfiles.push(profile))
        }

        return { userProfiles, hasMore, lastDocSnapshot }
      } catch (e) {
        logError(e, "UserStore.getMoreUserFollowing error")
      }

      return { userProfiles, hasMore: false, lastDocSnapshot: null }
    })

    return {
      initializeWithUserId,
      resetFeed,
      addWorkoutToStore,
      refreshWorkout,
      loadUserWorkouts,
      deleteWorkout,
      updateWorkoutInteractions,
      loadMoreFeedItems,
      addCommentToWorkout,
      removeCommentFromWorkout,
      likeWorkout,
      unlikeWorkout,
      refreshFeedItems,
      loadMoreOtherUserWorkouts,
      refreshOtherUserWorkouts,
      syncLocalUserWorkouts,
      blockUser,
      unblockUser,
      reportComment,
      reportUser,
      fetchUserProfileToStore,
      getMoreUserFollowing,
      getMoreUserFollowers,
    }
  })
