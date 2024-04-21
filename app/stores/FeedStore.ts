import firestore from "@react-native-firebase/firestore"
import { ExerciseSource, ExerciseVolumeType, WorkoutSource } from "app/data/constants"
import { CommentId, ExerciseId, UserId, WorkoutComment, WorkoutId } from "app/data/types"
import { api } from "app/services/api"
import { getNestedField } from "app/utils/getNestedField"
import { logError } from "app/utils/logger"
import { getTime, startOfWeek } from "date-fns"
import { randomUUID } from "expo-crypto"
import { toJS } from "mobx"
import { Instance, SnapshotOrInstance, flow, getEnv, types } from "mobx-state-tree"
import { convertUserToMSTSnapshot } from "./helpers/convertUserToMSTSnapshot"
import { convertWorkoutToMSTSnapshot } from "./helpers/convertWorkoutToMSTSnapshot"
import { RootStoreDependencies } from "./helpers/useStores"
import {
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

const WorkoutInteractionModel = types
  .model("WorkoutInteractionModel", {
    workoutId: types.identifier,
    workoutByUserId: types.string,
    likedByUserIds: types.array(types.string),
    comments: types.array(WorkoutCommentModel),
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
    isLoadingFeed: false,
    isLoadingUserWorkouts: false,
    isLoadingOtherUserWorkouts: false,
    lastFeedRefresh: types.maybe(types.Date),
    userId: types.maybeNull(types.string),
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
        .sort((a, b) => b.workout.startTime.getTime() - a.workout.startTime.getTime())

      return workouts
    }

    return {
      get weeklyWorkoutsCount() {
        const workouts = Array.from(self.userWorkoutMetas.values())
        const _weeklyWorkoutsCount = new Map<number, number>()
        workouts.forEach((w) => {
          // Find start of week (Monday)
          const weekStart = startOfWeek(w.startTime, {
            weekStartsOn: 1,
          })
          const weekStartTime = getTime(weekStart)

          if (!_weeklyWorkoutsCount.has(weekStartTime)) {
            _weeklyWorkoutsCount.set(weekStartTime, 0)
          }

          _weeklyWorkoutsCount.set(
            weekStartTime,
            (_weeklyWorkoutsCount.get(weekStartTime) ?? 0) + 1,
          )
        })

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
      getWorkout(workoutSource: WorkoutSource, workoutId: string) {
        if (
          (workoutSource === WorkoutSource.User && self.isLoadingUserWorkouts) ||
          (workoutSource === WorkoutSource.Feed && self.isLoadingFeed) ||
          (workoutSource === WorkoutSource.OtherUser && self.isLoadingOtherUserWorkouts)
        ) {
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
        )[0].setsPerformed?.[setOrder]
        if (!lastPerformedSet) return null

        console.debug("FeedStore.getSetFromWorkout() lastPerformedSet:", lastPerformedSet)
        return lastPerformedSet
      },
      getInteractionsForWorkout(workoutSource: WorkoutSource, workoutId: string) {
        if (
          (workoutSource === WorkoutSource.User && self.isLoadingUserWorkouts) ||
          (workoutSource === WorkoutSource.Feed && self.isLoadingFeed) ||
          (workoutSource === WorkoutSource.Feed && self.isLoadingFeed)
        ) {
          // console.debug("FeedStore.getInteractionsForWorkout loading workouts")
          return undefined
        }

        const interactions = self.workoutInteractions.get(workoutId)
        return interactions
      },
      getOtherUserWorkoutsListData(otherUserId: UserId) {
        return getAllWorkoutsListData(WorkoutSource.OtherUser, otherUserId)
      },
    }
  })
  .actions((self) => {
    function checkInitialized() {
      if (!self.userId) {
        console.warn("FeedStore is not initialized with userId")
        return false
      }
      return true
    }

    function setUserId(userId: UserId) {
      self.userId = userId
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
              break
          }

          if (!workoutMetas) {
            console.warn("FeedStore.addWorkoutToStore: workoutMetas is undefined")
            return
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

    const refreshWorkout = flow(function* (
      workoutSource: WorkoutSource,
      userId: UserId,
      workoutId: WorkoutId,
    ) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      try {
        let workout
        if (workoutSource === WorkoutSource.User) {
          workout = yield workoutRepository.get(workoutId, true)
        } else {
          workout = yield api.getOtherUserWorkout(userId, workoutId)
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
        self.userWorkoutMetas.clear()

        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const user = yield userRepository.get(self.userId, true)
        const workoutMetasMap = getNestedField(user, "workoutMetas")
        const workoutIds = workoutMetasMap && Object.keys(workoutMetasMap)

        if (!workoutMetasMap || !workoutIds || workoutIds.length === 0) {
          console.debug("FeedStore.loadUserWorkouts empty workoutMetas")
          self.isLoadingUserWorkouts = false
          return
        }

        const { workoutRepository, workoutInteractionRepository } =
          getEnv<RootStoreDependencies>(self)
        const workouts: IWorkoutSummaryModel[] = yield workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("FeedStore.loadUserWorkouts no workouts found")
          self.isLoadingUserWorkouts = false
          return
        }

        addWorkoutToStore(WorkoutSource.User, ...workouts)

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
        addWorkoutToStore(WorkoutSource.User, ...localWorkouts)

        console.debug("FeedStore.loadUserWorkouts done")
        self.isLoadingUserWorkouts = false
      } catch (e) {
        logError(e, "FeedStore.loadUserWorkouts error")
      }
    })

    const deleteWorkout = flow(function* (workoutId: WorkoutId) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      try {
        yield workoutRepository.delete(workoutId)
        self.workouts.delete(workoutId)
        const workoutMeta = self.userWorkoutMetas.find((w) => w.workoutId === workoutId)
        if (workoutMeta) {
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
        try {
          const user = yield userRepository.get(userId)
          self.otherUserProfiles.put(convertUserToMSTSnapshot(user))
        } catch (e) {
          logError(e, "FeedStore.fetchUserProfileToStore error")
        }
      }
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
      workoutByUserId: UserId,
      commentByUserId: UserId,
      comment: string,
    ) {
      // Nested FieldValue.serverTimestamp() in arrayUnion() is not supported
      // so we use the client timestamp instead, should be good enough for this case
      const newComment = {
        commentId: randomUUID(),
        byUserId: commentByUserId,
        comment,
        _createdAt: new Date(),
      } as WorkoutComment

      try {
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

    const likeWorkout = flow(function* (
      workoutId: WorkoutId,
      workoutByUserId: UserId,
      likedByUserId: UserId,
    ) {
      try {
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

    return {
      setUserId,
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
    }
  })
