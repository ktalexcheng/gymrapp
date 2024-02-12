import { Activity } from "app/data/types/activity.types"
import { SnapshotOrInstance, flow, getEnv, types } from "mobx-state-tree"
import { RootStoreDependencies } from "./helpers/useStores"
import { withSetPropAction } from "./helpers/withSetPropAction"

const ActivityModel = types
  .model({
    activityId: types.identifier,
    activityName: types.string,
    description: types.string,
  })
  .actions(withSetPropAction)

export type IActivityModel = SnapshotOrInstance<typeof ActivityModel>

const ActivityStoreModel = types
  .model("ActivityStore")
  .props({
    allActivities: types.map(ActivityModel),
    isLoading: true,
  })
  .actions((self) => ({
    getAllActivities: flow(function* () {
      self.isLoading = true

      try {
        // Fetch exercises and user settings
        const activities: Activity[] = yield getEnv<RootStoreDependencies>(
          self,
        ).activityRepository.getMany()

        if (!activities || activities.length === 0) {
          self.isLoading = false
          console.warn("ActivityStore.getAllActivities: no activities available")
          return
        }

        activities.forEach((a) => {
          self.allActivities.put(a)
        })

        self.isLoading = false
      } catch (e) {
        console.error("ActivityStore.getAllActivities error:", e)
      }
    }),
  }))

export { ActivityStoreModel }
