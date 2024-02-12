import firestore from "@react-native-firebase/firestore"
import { ExerciseSource, ExerciseVolumeType, WorkoutSource } from "app/data/constants"
import { ExerciseId, UserId, Workout, WorkoutComment, WorkoutId } from "app/data/types"
import { api } from "app/services/api"
import { getNestedField } from "app/utils/getNestedField"
import { getTime, startOfWeek } from "date-fns"
import { randomUUID } from "expo-crypto"
import { Instance, SnapshotOrInstance, flow, getEnv, types } from "mobx-state-tree"
import { UserModel } from "./UserStore"
import { convertUserToMSTModel } from "./helpers/convertUserToMSTModel"
import { RootStoreDependencies } from "./helpers/useStores"
import { MetadataModel, PersonalRecordModel, SetPerformedModel } from "./models"

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
  }),
)

const TimeExerciseSummaryModel = types.compose(
  "TimeExerciseSummaryModel",
  BaseExerciseSummaryModel,
  types.model({
    volumeType: types.literal(ExerciseVolumeType.Time),
    totalTime: types.number,
  }),
)

export const ExerciseSummaryModel = types.union(
  { eager: true },
  RepsExerciseSummaryModel,
  TimeExerciseSummaryModel,
)

export const WorkoutSummaryModel = types.compose(
  "WorkoutSummaryModel",
  MetadataModel,
  types.model({
    workoutId: types.identifier,
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
)

const WorkoutCommentModel = types.model("WorkoutCommentModel", {
  _createdAt: types.Date,
  commentId: types.identifier,
  byUserId: types.string,
  comment: types.string,
})

const WorkoutInteractionModel = types.model("WorkoutInteractionModel", {
  workoutId: types.identifier,
  workoutByUserId: types.string,
  likedByUserIds: types.array(types.string),
  comments: types.array(WorkoutCommentModel),
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
    isLoadingFeed: true,
    isLoadingUserWorkouts: true,
    lastFeedRefresh: types.maybe(types.Date),
    userId: types.maybeNull(types.string),
    oldestFeedItemId: types.maybe(types.string),
    noMoreFeedItems: false,
    workoutInteractions: types.map(WorkoutInteractionModel),
    userWorkouts: types.map(WorkoutSummaryModel),
    feedWorkouts: types.map(WorkoutSummaryModel),
    feedUsers: types.map(UserModel),
  })
  .props({
    isLoadingOtherUserWorkouts: false,
    otherUserWorkouts: types.map(
      types.model("OtherUserWorkoutsModel", {
        byUserId: types.identifier,
        lastWorkoutId: types.string,
        noMoreItems: types.boolean,
        workouts: types.map(WorkoutSummaryModel),
      }),
    ),
    otherUserWorkoutInteractions: types.map(
      types.model("OtherUserWorkoutInteractionsModel", {
        byUserId: types.identifier,
        workouts: types.map(WorkoutInteractionModel),
      }),
    ),
  })
  .views((self) => ({
    get weeklyWorkoutsCount() {
      const workouts = Array.from(self.userWorkouts.values())
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

        _weeklyWorkoutsCount.set(weekStartTime, (_weeklyWorkoutsCount.get(weekStartTime) ?? 0) + 1)
      })

      return _weeklyWorkoutsCount
    },
    getWorkout(workoutSource: WorkoutSource, workoutId: string, byUserId?: string) {
      if (workoutSource === WorkoutSource.OtherUser) {
        if (!byUserId) {
          console.error(
            "FeedStore.getWorkout workoutSource is OtherUser but byUserId is not defined",
          )
          return undefined
        }

        if (self.isLoadingOtherUserWorkouts) {
          console.debug("FeedStore.getWorkout loading workouts")
          return undefined
        }

        return self.otherUserWorkouts.get(byUserId)?.workouts.get(workoutId)
      }

      if (
        (workoutSource === WorkoutSource.User && self.isLoadingUserWorkouts) ||
        (workoutSource === WorkoutSource.Feed && self.isLoadingFeed)
      ) {
        console.debug("FeedStore.getWorkout loading workouts")
        return undefined
      }

      return self.userWorkouts.get(workoutId) || self.feedWorkouts.get(workoutId)
    },
    getSetFromWorkout(workoutId: WorkoutId, exerciseId: ExerciseId, setOrder: number) {
      console.debug("FeedStore.getSetFromWorkout workoutId:", workoutId)
      const latestWorkout = self.userWorkouts.get(workoutId)
      if (!latestWorkout) return null

      console.debug("FeedStore.latestWorkout:", latestWorkout)
      const lastPerformedSet = latestWorkout.exercises.filter((e) => e.exerciseId === exerciseId)[0]
        .setsPerformed?.[setOrder]
      if (!lastPerformedSet) return null

      return lastPerformedSet
    },
    getInteractionsForWorkout(workoutSource: WorkoutSource, workoutId: string) {
      if (
        (workoutSource === WorkoutSource.User && self.isLoadingUserWorkouts) ||
        (workoutSource === WorkoutSource.Feed && self.isLoadingFeed)
      ) {
        console.debug("FeedStore.getInteractionsForWorkout loading workouts")
        return undefined
      }

      const interactions = self.workoutInteractions.get(workoutId) || undefined
      if (!interactions) {
        // This is possible if no user has interacted with the workout yet
        console.debug(
          "FeedStore.getInteractionsForWorkout no interactions found for workoutId:",
          workoutId,
        )
      }
      return interactions
    },
  }))
  .actions((self) => {
    function checkInitialized() {
      if (!self.userId) {
        console.error("FeedStore is not initialized with userId")
        return false
      }
      return true
    }

    function setUserId(userId: UserId) {
      const { feedRepository, userRepository } = getEnv<RootStoreDependencies>(self)
      console.debug("FeedStore.setUserId userId:", userId)
      self.userId = userId
      feedRepository.setUserId(userId)
      userRepository.setUserId(userId)
    }

    function resetFeed() {
      self.userId = null
      self.isLoadingFeed = true
      self.isLoadingUserWorkouts = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.feedWorkouts.clear()
      self.workoutInteractions.clear()
      self.feedUsers.clear()
    }

    function addUserWorkout(workout: Instance<typeof WorkoutSummaryModel>) {
      self.userWorkouts.put(workout)
    }

    const loadUserWorkouts = flow(function* () {
      console.debug("FeedStore.loadUserWorkouts called")
      if (!checkInitialized() || !self.userId) return undefined

      try {
        self.isLoadingUserWorkouts = true
        self.userWorkouts.clear()

        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const user = yield userRepository.get(self.userId, true)
        const workoutMetas = getNestedField(user, "workoutMetas")

        if (!workoutMetas) {
          console.debug("FeedStore.loadUserWorkouts empty workoutMetas")
          self.isLoadingUserWorkouts = false
          return
        }

        const { workoutRepository, workoutInteractionRepository } =
          getEnv<RootStoreDependencies>(self)
        const workoutIds = Object.keys(workoutMetas)
        const workouts: IWorkoutSummaryModel[] = yield workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("FeedStore.loadUserWorkouts no workouts found")
          self.isLoadingUserWorkouts = false
          return
        }

        workouts.forEach((w) => {
          self.userWorkouts.put(w)
        })

        const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
        workoutInteractions.forEach((interaction) => {
          self.workoutInteractions.put({
            workoutId: interaction.workoutId,
            workoutByUserId: interaction.workoutByUserId,
            likedByUserIds: interaction.likedByUserIds,
            comments: interaction.comments,
          })
        })

        console.debug("FeedStore.loadUserWorkouts done")
        self.isLoadingUserWorkouts = false
      } catch (e) {
        console.error("FeedStore.loadUserWorkouts error:", e)
      }
    })

    const updateWorkout = flow(function* (workoutId: WorkoutId, data: Partial<Workout>) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      const workout = self.getWorkout(WorkoutSource.User, workoutId)
      const updatedWorkout = { ...workout, ...data }

      try {
        yield workoutRepository.update(workoutId, updatedWorkout as any) // TODO: Figure out why this is not working, cast as any for now
        self.userWorkouts.put({ workoutId, ...(updatedWorkout as any) }) // TODO: Figure out why this is not working, cast as any for now
      } catch (e) {
        console.error("FeedStore.updateWorkout error:", e)
      }
    })

    const deleteWorkout = flow(function* (workoutId: WorkoutId) {
      const { workoutRepository } = getEnv<RootStoreDependencies>(self)

      try {
        yield workoutRepository.delete(workoutId)
        self.userWorkouts.delete(workoutId)
      } catch (e) {
        console.error("FeedStore.deleteWorkout error:", e)
      }
    })

    function updateWorkoutInteractions(workoutInteractions: IWorkoutInteractionModel) {
      self.workoutInteractions.put(workoutInteractions)
    }

    const fetchUserProfileToStore = flow(function* (userId: UserId) {
      const { userRepository } = getEnv<RootStoreDependencies>(self)
      if (!self.feedUsers.has(userId)) {
        try {
          const user = yield userRepository.get(userId)
          self.feedUsers.put(convertUserToMSTModel(user))
        } catch (e) {
          console.error("FeedStore.fetchUserProfileToStore error:", e)
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
        const workoutIds: string[] = []
        for (const workout of workouts) {
          self.feedWorkouts.put(workout)
          workoutIds.push(workout.workoutId)
        }
        const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
        for (const interaction of workoutInteractions) {
          self.workoutInteractions.put(interaction)
        }

        const feedUserIds = workouts.map((w) => w.byUserId)
        for (const feedUserId of feedUserIds) {
          yield fetchUserProfileToStore(feedUserId)
        }

        return workouts
      } catch (e) {
        console.error("FeedStore.loadMoreFeedItems error:", e)
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
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      // Nested FieldValue.serverTimestamp() in arrayUnion() is not supported
      // so we use the client timestamp instead, should be good enough for this case
      const newComment = {
        commentId: randomUUID(),
        byUserId: commentByUserId,
        comment,
        _createdAt: new Date(),
      } as WorkoutComment

      let updatedInteractions
      const docExists = yield workoutInteractionRepository.checkDocumentExists(workoutId)
      if (docExists) {
        updatedInteractions = yield workoutInteractionRepository.update(
          workoutId,
          {
            comments: firestore.FieldValue.arrayUnion(newComment),
          },
          false,
        )
      } else {
        updatedInteractions = yield workoutInteractionRepository.create({
          workoutId,
          workoutByUserId,
          comments: [newComment],
        })
      }

      self.workoutInteractions.put(updatedInteractions)
    })

    const removeCommentFromWorkout = flow(function* (
      workoutId: WorkoutId,
      workoutComment: IWorkoutCommentModel,
    ) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      const updatedInteractions = yield workoutInteractionRepository
        .update(
          workoutId,
          {
            comments: firestore.FieldValue.arrayRemove(workoutComment),
          },
          false,
        )
        .catch((e) => {
          console.error("FeedStore.removeCommentFromWorkout error:", e)
        })
      self.workoutInteractions.put(updatedInteractions)
    })

    const likeWorkout = flow(function* (
      workoutId: WorkoutId,
      workoutByUserId: UserId,
      likedByUserId: UserId,
    ) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)

      const docExists = yield workoutInteractionRepository.checkDocumentExists(workoutId)
      try {
        if (docExists) {
          yield workoutInteractionRepository.update(
            workoutId,
            {
              likedByUserIds: firestore.FieldValue.arrayUnion(likedByUserId),
            },
            false,
          )
        } else {
          yield workoutInteractionRepository.create({
            workoutId,
            workoutByUserId,
            likedByUserIds: [likedByUserId],
          })
        }
      } catch (e) {
        console.error("FeedStore.likeWorkout error:", e)
      }
    })

    const unlikeWorkout = flow(function* (workoutId: WorkoutId, byUserId: UserId) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      yield workoutInteractionRepository
        .update(
          workoutId,
          {
            likedByUserIds: firestore.FieldValue.arrayRemove(byUserId),
          },
          false,
        )
        .catch((e) => {
          console.error("FeedStore.unlikeWorkout error:", e)
        })
    })

    const refreshFeedItems = flow(function* () {
      // self.isLoadingFeed = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      yield loadMoreFeedItems()
      self.lastFeedRefresh = new Date()
    })

    const loadMoreOtherUserWorkouts = flow(function* (otherUserId: UserId) {
      const otherUserWorkouts = self.otherUserWorkouts.get(otherUserId)
      const lastFeedItemId = otherUserWorkouts
        ? self.otherUserWorkouts.get(otherUserId)?.lastWorkoutId
        : undefined
      const noMoreItems = otherUserWorkouts
        ? self.otherUserWorkouts.get(otherUserId)?.noMoreItems
        : false

      if (noMoreItems) return undefined

      try {
        self.isLoadingOtherUserWorkouts = true

        const {
          lastWorkoutId: newLastWorkoutId,
          noMoreItems: newNoMoreItems,
          workouts: newWorkouts,
        } = yield api.getOtherUserWorkouts(otherUserId, lastFeedItemId)

        const newWorkoutsMap = newWorkouts.reduce(
          (acc, workout) => ({ ...acc, [workout.workoutId]: workout }),
          {},
        )
        if (otherUserWorkouts) {
          otherUserWorkouts.lastWorkoutId = newLastWorkoutId
          otherUserWorkouts.noMoreItems = newNoMoreItems
          otherUserWorkouts.workouts.put(newWorkoutsMap)
        } else {
          self.otherUserWorkouts.put({
            byUserId: otherUserId,
            lastWorkoutId: newLastWorkoutId,
            noMoreItems: newNoMoreItems,
            workouts: newWorkoutsMap,
          })
        }
      } catch (e) {
        console.error("FeedStore.loadMoreOtherUserWorkouts error:", e)
      } finally {
        self.isLoadingOtherUserWorkouts = false
      }
    })

    const refreshOtherUserWorkouts = flow(function* (otherUserId: UserId) {
      self.otherUserWorkouts.delete(otherUserId)
      yield loadMoreOtherUserWorkouts(otherUserId)
    })

    return {
      setUserId,
      resetFeed,
      addUserWorkout,
      loadUserWorkouts,
      updateWorkout,
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
    }
  })
