import firestore from "@react-native-firebase/firestore"
import { WorkoutSource } from "app/data/constants"
import {
  ExerciseId,
  User,
  UserId,
  Workout,
  WorkoutComment,
  WorkoutId,
  WorkoutInteraction,
  isWorkout,
} from "app/data/model"
import { api } from "app/services/api"
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
    workoutByUserId: types.string,
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
    userId: types.maybe(types.string),
    oldestFeedItemId: types.maybe(types.string),
    noMoreFeedItems: false,
    workoutInteractions: WorkoutInteractionsModel,
    userWorkouts: WorkoutModel,
    // feedItems: types.array(
    //   types.model({
    //     feedItemId: types.identifier,
    //     byUserId: types.string,
    //     startTime: types.Date,
    //     workoutId: types.string,
    //   }),
    // ),
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
    getSetFromWorkout(workoutId: WorkoutId, exerciseId: ExerciseId, setOrder: number) {
      console.debug("FeedStore.getSetFromWorkout workoutId:", workoutId)
      const latestWorkout = self.userWorkouts.get(workoutId)
      console.debug("FeedStore.userWorkouts:", self.userWorkouts)
      console.debug("FeedStore.latestWorkout:", latestWorkout)
      const lastPerformedSet = latestWorkout.workout.exercises.filter(
        (e) => e.exerciseId === exerciseId,
      )[0].setsPerformed?.[setOrder]
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
      const { feedRepository } = getEnv<RootStoreDependencies>(self)
      console.debug("FeedStore.setUserId userId:", userId)
      self.userId = userId
      feedRepository.setUserId(userId)
    }

    function resetFeed() {
      self.userId = undefined
      self.isLoadingFeed = true
      self.isLoadingUserWorkouts = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      // self.feedItems.clear()
      self.feedWorkouts.clear()
      self.workoutInteractions.clear()
      self.feedUsers.clear()
    }

    const loadUserWorkouts = flow(function* () {
      console.debug("FeedStore.loadUserWorkouts called")
      if (!checkInitialized()) return undefined

      try {
        self.isLoadingUserWorkouts = true

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
        const workouts: Workout[] = yield workoutRepository.getMany(workoutIds)

        if (!workouts) {
          console.debug("FeedStore.loadUserWorkouts no workouts found")
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

    function updateWorkoutInteractions(workoutInteractions: WorkoutInteraction) {
      self.workoutInteractions.put(workoutInteractions)
    }

    const loadMoreFeedItems = flow(function* () {
      console.debug("FeedStore.loadMoreFeedItems called")
      if (!checkInitialized()) return undefined
      if (self.noMoreFeedItems) return undefined

      self.isLoadingFeed = true
      const { feedRepository, workoutRepository, workoutInteractionRepository, userRepository } =
        getEnv<RootStoreDependencies>(self)

      // const batchSize = 20
      // const newFeedItems: UserFeedItem[] = yield feedRepository
      //   .getByFilter({
      //     orderByField: "feedItemId",
      //     orderDirection: "desc",
      //     limit: batchSize,
      //     afterFieldValue: self.oldestFeedItemId,
      //   })
      //   .catch((e) => {
      //     console.error("FeedStore.loadMoreFeedItems error", e)
      //   })
      // newFeedItems.sort((a, b) => (a.feedItemId > b.feedItemId ? -1 : 1))
      // self.feedItems.push(...newFeedItems)

      // if (newFeedItems.length < batchSize) {
      //   self.noMoreFeedItems = true
      // }

      // if (newFeedItems.length > 0) {
      //   // Get workouts for feed items
      //   const feedWorkoutIds = newFeedItems.map((feedItem) => feedItem.workoutId)
      //   const feedWorkouts = yield workoutRepository.getMany(feedWorkoutIds)
      //   const feedWorkoutInteractions = yield workoutInteractionRepository.getMany(feedWorkoutIds)
      //   for (const workout of feedWorkouts) {
      //     self.feedWorkouts.put({ workoutId: workout.workoutId, workout })
      //   }
      //   for (const interaction of feedWorkoutInteractions) {
      //     self.workoutInteractions.put({
      //       workoutId: interaction.workoutId,
      //       likedByUserIds: interaction.likedByUserIds,
      //       comments: interaction.comments,
      //     })
      //   }
      //   self.oldestFeedItemId = newFeedItems[newFeedItems.length - 1].feedItemId

      //   // Get users for feed items
      //   const feedUserIds = newFeedItems.map((feedItem) => feedItem.byUserId)
      //   const feedUsers = yield userRepository.getMany(feedUserIds)
      //   for (const user of feedUsers) {
      //     self.feedUsers.put({ userId: user.userId, user })
      //   }
      // }

      const { lastFeedItemId, noMoreItems, workouts } = yield api.getFeedWorkouts(
        self.oldestFeedItemId,
      )
      self.oldestFeedItemId = lastFeedItemId === null ? undefined : lastFeedItemId
      self.noMoreFeedItems = noMoreItems
      const workoutIds = []
      for (const workout of workouts) {
        self.feedWorkouts.put({ workoutId: workout.workoutId, workout })
        workoutIds.push(workout.workoutId)
      }
      const workoutInteractions = yield workoutInteractionRepository.getMany(workoutIds)
      for (const interaction of workoutInteractions) {
        self.workoutInteractions.put(interaction)
      }

      const feedUserIds = workouts.map((w) => w.byUserId)
      for (const feedUserId of feedUserIds) {
        if (!self.feedUsers.has(feedUserId)) {
          const user = yield userRepository.get(feedUserId)
          self.feedUsers.put({ userId: feedUserId, user })
        }
      }

      self.isLoadingFeed = false
      return workouts
    })

    const addCommentToWorkout = flow(function* (
      workoutId: WorkoutId,
      byUserId: UserId,
      comment: string,
    ) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      // Nested FieldValue.serverTimestamp() in arrayUnion() is not supported
      // so we use the client timestamp instead, should be good enough for this case
      const newComment = {
        commentId: randomUUID(),
        byUserId,
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
          } as unknown,
          false,
        )
      } else {
        const workoutByUserId = self.feedWorkouts.get(workoutId)?.workout.byUserId
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
      workoutComment: WorkoutComment,
    ) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)
      const updatedInteractions = yield workoutInteractionRepository
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
      self.workoutInteractions.put(updatedInteractions)
    })

    const likeWorkout = flow(function* (workoutId: WorkoutId, byUserId: UserId) {
      const { workoutInteractionRepository } = getEnv<RootStoreDependencies>(self)

      const docExists = yield workoutInteractionRepository.checkDocumentExists(workoutId)
      try {
        if (docExists) {
          yield workoutInteractionRepository.update(
            workoutId,
            {
              likedByUserIds: firestore.FieldValue.arrayUnion(byUserId),
            } as unknown,
            false,
          )
        } else {
          const workoutByUserId = self.feedWorkouts.get(workoutId)?.workout.byUserId
          yield workoutInteractionRepository.create({
            workoutId,
            workoutByUserId,
            likedByUserIds: [byUserId],
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
          } as unknown,
          false,
        )
        .catch((e) => {
          console.error("FeedStore.unlikeWorkout error:", e)
        })
    })

    const refreshFeedItems = flow(function* () {
      self.isLoadingFeed = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      // self.feedItems.clear()
      yield loadMoreFeedItems()
      self.lastFeedRefresh = new Date()
    })

    return {
      setUserId,
      resetFeed,
      loadUserWorkouts,
      updateWorkoutInteractions,
      loadMoreFeedItems,
      addCommentToWorkout,
      removeCommentFromWorkout,
      likeWorkout,
      unlikeWorkout,
      refreshFeedItems,
    }
  })
