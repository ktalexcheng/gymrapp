import firestore from "@react-native-firebase/firestore"
import { WorkoutSource } from "app/data/constants"
import {
  ExerciseId,
  User,
  UserFeedItem,
  UserId,
  Workout,
  WorkoutComment,
  WorkoutId,
  WorkoutInteraction,
  isWorkout,
} from "app/data/model"
import { getNestedField } from "app/utils/getNestedField"
import { getTime, startOfWeek } from "date-fns"
import { randomUUID } from "expo-crypto"
import { flow, getEnv, types } from "mobx-state-tree"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"

const WorkoutType = createCustomType<Workout>("Workout", isWorkout)
const WorkoutModel = types.map(
  types.model({
    workoutId: types.identifier,
    workout: WorkoutType,
  }),
)
const WorkoutInteractionsModel = types.map(
  types.model({
    workoutId: types.identifier,
    likedByUserIds: types.array(types.string),
    comments: types.array(
      types.model({
        commentId: types.identifier,
        byUserId: types.string,
        comment: types.string,
        _createdAt: types.Date,
      }),
    ),
  }),
)

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
    workoutInteractions: WorkoutInteractionsModel,
    userWorkouts: WorkoutModel,
    feedItems: types.array(
      types.model({
        feedItemId: types.identifier,
        byUserId: types.string,
        startTime: types.Date,
        workoutId: types.string,
      }),
    ),
    feedWorkouts: WorkoutModel,
    feedUsers: types.map(
      types.model({
        userId: types.identifier,
        user: types.frozen<User>(),
      }),
    ),
  })
  .views((self) => ({
    get weeklyWorkoutsCount() {
      const workouts = Array.from(self.userWorkouts.values())
      const weeklyWorkoutsCount = new Map<number, number>()
      workouts.forEach((w) => {
        // Find start of week (Monday)
        const weekStart = startOfWeek(w.workout.startTime, {
          weekStartsOn: 1,
        })
        const weekStartTime = getTime(weekStart)

        if (!weeklyWorkoutsCount.has(weekStartTime)) {
          weeklyWorkoutsCount.set(weekStartTime, 0)
        }

        weeklyWorkoutsCount.set(weekStartTime, weeklyWorkoutsCount.get(weekStartTime) + 1)
      })

      // console.debug(
      //   "FeedStore.weeklyWorkoutsCount weekStartTime.keys():",
      //   ...weeklyWorkoutsCount.keys(),
      // )
      return weeklyWorkoutsCount
    },
  }))
  .actions((self) => ({
    setUserId: (userId: UserId) => {
      const { feedRepository } = getEnv<RootStoreDependencies>(self)
      self.userId = userId
      feedRepository.setUserId(userId)
    },
    resetFeed: () => {
      self.isLoadingFeed = true
      self.isLoadingUserWorkouts = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.feedItems.clear()
      self.feedWorkouts.clear()
      self.workoutInteractions.clear()
      self.feedUsers.clear()
    },
    loadUserWorkouts: flow(function* () {
      console.debug("FeedStore.getWorkouts called")
      if (!self.userId) {
        console.error("FeedStore.getWorkouts userId is null")
        return
      }

      try {
        self.isLoadingUserWorkouts = true

        const { userRepository } = getEnv<RootStoreDependencies>(self)
        const user = yield userRepository.get(self.userId)
        const workoutMetas = getNestedField(user, "workoutMetas")

        if (!workoutMetas) {
          console.debug("FeedStore.getWorkouts empty workoutMetas")
          self.isLoadingUserWorkouts = false
          return
        }

        const { workoutRepository, workoutInteractionRepository } =
          getEnv<RootStoreDependencies>(self)
        const workoutIds = Object.keys(workoutMetas)
        const workouts: Workout[] = yield workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("FeedStore.getWorkouts no workouts found")
          self.isLoadingUserWorkouts = false
          return
        }

        workouts.forEach((w) => {
          self.userWorkouts.put({
            workoutId: w.workoutId,
            workout: w,
          })
        })

        const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
        workoutInteractions.forEach((interaction) => {
          self.workoutInteractions.put({
            workoutId: interaction.workoutId,
            likedByUserIds: interaction.likedByUserIds,
            comments: interaction.comments,
          })
        })

        console.debug("FeedStore.getWorkouts done")
        self.isLoadingUserWorkouts = false
      } catch (e) {
        console.error("FeedStore.getWorkouts error:", e)
      }
    }),
    // updateWorkout(workoutSource: "user" | "feed", workoutId: WorkoutId, workout: Workout) {
    //   switch (workoutSource) {
    //     case "user":
    //       self.userWorkouts.put({ workoutId, workout })
    //       break
    //     case "feed":
    //       self.feedWorkouts.put({ workoutId, workout })
    //       break
    //     default:
    //       console.error("FeedStore.updateWorkout invalid workoutSource:", workoutSource)
    //   }
    // },
    updateWorkoutInteractions(workoutInteractions: WorkoutInteraction) {
      self.workoutInteractions.put(workoutInteractions)
    },
    getSetFromWorkout(workoutId: WorkoutId, exerciseId: ExerciseId, setOrder: number) {
      const latestWorkout = self.userWorkouts.get(workoutId)
      const lastPerformedSet = latestWorkout.workout.exercises.filter(
        (e) => e.exerciseId === exerciseId,
      )[0].setsPerformed?.[setOrder]
      if (!lastPerformedSet) return null

      return lastPerformedSet
    },
    loadFeedItems: flow(function* () {
      console.debug("FeedStore.loadFeedItems called")
      self.isLoadingFeed = true
      const { feedRepository, workoutRepository, workoutInteractionRepository, userRepository } =
        getEnv<RootStoreDependencies>(self)

      const batchSize = 20
      const newFeedItems: UserFeedItem[] = yield feedRepository
        .getByFilter("feedItemId", "desc", batchSize, self.oldestFeedItemId)
        .catch((e) => {
          console.error("FeedStore.loadFeedItems error", e)
        })
      newFeedItems.sort((a, b) => (a.feedItemId > b.feedItemId ? -1 : 1))
      self.feedItems.push(...newFeedItems)

      if (newFeedItems.length < batchSize) {
        self.noMoreFeedItems = true
      }

      if (newFeedItems.length > 0) {
        // Get workouts for feed items
        const feedWorkoutIds = newFeedItems.map((feedItem) => feedItem.workoutId)
        const feedWorkouts = yield workoutRepository.getMany(feedWorkoutIds)
        const feedWorkoutInteractions = yield workoutInteractionRepository.getMany(feedWorkoutIds)
        for (const workout of feedWorkouts) {
          self.feedWorkouts.put({ workoutId: workout.workoutId, workout })
        }
        for (const interaction of feedWorkoutInteractions) {
          self.workoutInteractions.put({
            workoutId: interaction.workoutId,
            likedByUserIds: interaction.likedByUserIds,
            comments: interaction.comments,
          })
        }
        self.oldestFeedItemId = newFeedItems[newFeedItems.length - 1].feedItemId

        // Get users for feed items
        const feedUserIds = newFeedItems.map((feedItem) => feedItem.byUserId)
        const feedUsers = yield userRepository.getMany(feedUserIds)
        for (const user of feedUsers) {
          self.feedUsers.put({ userId: user.userId, user })
        }
      }

      console.debug("FeedStore.loadFeedItems done")
      self.isLoadingFeed = false
      return newFeedItems
    }),
    // getFeedWorkout(workoutId: string) {
    //   return self.feedWorkouts.get(workoutId)
    // },
    getWorkout(workoutSource: WorkoutSource, workoutId: string) {
      if (
        (workoutSource === WorkoutSource.User && self.isLoadingUserWorkouts) ||
        (workoutSource === WorkoutSource.Feed && self.isLoadingFeed)
      ) {
        console.debug("FeedStore.getWorkout loading workouts")
        return undefined
      }

      const workout =
        self.userWorkouts.get(workoutId)?.workout ||
        self.feedWorkouts.get(workoutId)?.workout ||
        undefined
      if (!workout) {
        // This should not be possible
        console.debug("FeedStore.getWorkout no workout found for workoutId:", workoutId)
      }
      return workout
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
    addCommentToWorkout: flow(function* (workoutId: WorkoutId, byUserId: UserId, comment: string) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      // Nested FieldValue.serverTimestamp() in arrayUnion() is not supported
      // so we use the client timestamp instead, should be good enough for this case
      const newComment = {
        commentId: randomUUID(),
        byUserId,
        comment,
        _createdAt: new Date(),
      } as WorkoutComment
      yield workoutInteractionRepository
        .update(
          workoutId,
          {
            comments: firestore.FieldValue.arrayUnion(newComment),
          } as unknown,
          false,
        )
        .catch((e) => {
          console.error("FeedStore.addCommentToWorkout error:", e)
        })
    }),
    removeCommentFromWorkout: flow(function* (
      workoutId: WorkoutId,
      workoutComment: WorkoutComment,
    ) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      yield workoutInteractionRepository
        .update(
          workoutId,
          {
            comments: firestore.FieldValue.arrayRemove(workoutComment),
          } as unknown,
          false,
        )
        .catch((e) => {
          console.error("FeedStore.removeCommentFromWorkout error:", e)
        })
    }),
    likeWorkout: flow(function* (workoutId: WorkoutId, byUserId: UserId) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      yield workoutInteractionRepository
        .update(
          workoutId,
          {
            likedByUserIds: firestore.FieldValue.arrayUnion(byUserId),
          } as unknown,
          false,
        )
        .catch((e) => {
          console.error("FeedStore.likeWorkout error:", e)
        })
    }),
    unlikeWorkout: flow(function* (workoutId: WorkoutId, byUserId: UserId) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      yield workoutInteractionRepository
        .update(
          workoutId,
          {
            likedByUserIds: firestore.FieldValue.arrayRemove(byUserId),
          } as unknown,
          false,
        )
        .catch((e) => {
          console.error("FeedStore.unlikeWorkout error:", e)
        })
    }),
  }))
  .actions((self) => ({
    refreshFeedItems: flow(function* () {
      self.isLoadingFeed = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.feedItems.clear()
      yield self.loadFeedItems()
      self.lastFeedRefresh = new Date()
    }),
    loadMoreFeedItems: flow<UserFeedItem[], any>(function* () {
      if (self.noMoreFeedItems) return undefined
      return yield self.loadFeedItems()
    }),
  }))
