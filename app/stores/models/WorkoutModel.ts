import { ExerciseSetType, ExerciseVolumeType } from "app/data/constants"
import { randomUUID } from "expo-crypto"
import { SnapshotOrInstance, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"

// A snapshot processor that assigns a random UUID to the setId property if it is missing
const assignSetIdSnapshotProcessor = (model) => {
  return types.snapshotProcessor(model, {
    preProcessor: (snapshot: any) => {
      if (!snapshot?.setId) {
        return {
          ...snapshot,
          setId: randomUUID(),
        }
      }

      return snapshot
    },
  })
}

export const BaseSetPerformedModel = types
  .model({
    setId: types.identifier, // Required as key when list rendering sets to ensure proper state updates
    setOrder: types.number,
    setType: types.enumeration("ExerciseSetType", Object.values(ExerciseSetType)),
    isCompleted: types.boolean,
    isNewRecord: types.optional(types.boolean, false),
  })
  .actions(withSetPropAction)
  // This is a workaround for a bug in mobx-state-tree where the type of action parameters for union types is not inferred correctly
  // See: https://github.com/mobxjs/mobx-state-tree/issues/1371
  .actions((self) => ({
    updateSetValues(prop: "weight" | "reps" | "rpe" | "time", value: number | null) {
      if (value !== null && value !== undefined && value >= 0) {
        self[prop] = value
      } else {
        self[prop] = null
      }
    },
  }))

export const RepsSetPerformedModel = assignSetIdSnapshotProcessor(
  types.compose(
    "RepsSetPerformedModel",
    BaseSetPerformedModel,
    types.model({
      volumeType: types.literal(ExerciseVolumeType.Reps),
      weight: types.maybeNull(types.number),
      reps: types.maybeNull(types.number), // null only on creation, we validate it as non-null when saving
      rpe: types.maybeNull(types.number),
    }),
  ),
)

export const TimeSetPerformedModel = assignSetIdSnapshotProcessor(
  types.compose(
    "TimeSetPerformedModel",
    BaseSetPerformedModel,
    types.model({
      volumeType: types.literal(ExerciseVolumeType.Time),
      time: types.maybeNull(types.number), // null only on creation, we validate it as non-null when saving
    }),
  ),
)

export const SetPerformedModel = types.union(
  { eager: false },
  RepsSetPerformedModel,
  TimeSetPerformedModel,
)

export type IRepsSetPerformedModel = SnapshotOrInstance<typeof RepsSetPerformedModel>
export type ITimeSetPerformedModel = SnapshotOrInstance<typeof TimeSetPerformedModel>
export type ISetPerformedModel = IRepsSetPerformedModel | ITimeSetPerformedModel
