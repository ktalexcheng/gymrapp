import { User, UserFeedItem, Workout, isWorkout } from "app/data/model"
import { flow, getEnv, types } from "mobx-state-tree"
import { createCustomType } from "./helpers/createCustomType"
import { RootStoreDependencies } from "./helpers/useStores"

const WorkoutType = createCustomType<Workout>("Workout", isWorkout)

export const FeedStoreModel = types
  .model("FeedStoreModel")
  .props({
    isLoading: true,
    lastFeedRefresh: types.maybe(types.Date),
    oldestFeedItemId: types.maybe(types.string),
    noMoreFeedItems: false,
    feedItems: types.array(
      types.model({
        feedItemId: types.identifier,
        byUserId: types.string,
        startTime: types.Date,
        workoutId: types.string,
      }),
    ),
    feedWorkouts: types.map(
      types.model({
        workoutId: types.identifier,
        workout: WorkoutType,
      }),
    ),
    feedUsers: types.map(
      types.model({
        userId: types.identifier,
        user: types.frozen<User>(),
      }),
    ),
  })
  .actions((self) => ({
    loadFeedItems: flow(function* () {
      console.debug("FeedStore.loadFeedItems called")
      self.isLoading = true
      const { feedRepository, workoutRepository, publicUserRepository } =
        getEnv<RootStoreDependencies>(self)

      let userFeedItems: UserFeedItem[]
      try {
        userFeedItems = yield feedRepository.getByFilter(
          "feedItemId",
          "desc",
          50,
          self.oldestFeedItemId,
        )
      } catch (e) {
        console.error("FeedStore.loadFeedItems error", e)
      }
      self.feedItems.push(...userFeedItems)

      if (userFeedItems.length < 50) {
        self.noMoreFeedItems = true
      }

      if (userFeedItems.length > 0) {
        // Get workouts for feed items
        const feedWorkoutIds = userFeedItems.map((feedItem) => feedItem.workoutId)
        const feedWorkouts = yield workoutRepository.getMany(feedWorkoutIds)
        for (const workout of feedWorkouts) {
          self.feedWorkouts.put({ workoutId: workout.workoutId, workout })
        }
        self.oldestFeedItemId = self.feedItems[self.feedItems.length - 1].feedItemId

        // Get users for feed items
        const feedUserIds = userFeedItems.map((feedItem) => feedItem.byUserId)
        const feedUsers = yield publicUserRepository.getMany(feedUserIds)
        for (const user of feedUsers) {
          self.feedUsers.put({ userId: user.userId, user })
        }
      }

      self.isLoading = false
      console.debug("FeedStore.loadFeedItems done")
    }),
  }))
  .actions((self) => ({
    refreshFeedItems: flow(function* () {
      self.isLoading = true
      self.lastFeedRefresh = undefined
      self.oldestFeedItemId = undefined
      self.noMoreFeedItems = false
      self.feedItems.clear()
      self.feedWorkouts.clear()
      yield self.loadFeedItems()
      self.lastFeedRefresh = new Date()
    }),
    loadMoreFeedItems: flow(function* () {
      if (!self.noMoreFeedItems) {
        self.loadFeedItems()
      }
    }),
    getFeedWorkout(workoutId: string) {
      return self.feedWorkouts.get(workoutId)
    },
  }))
