import { ExerciseVolumeType } from "app/data/constants"
import { SnapshotOrInstance, types } from "mobx-state-tree"

const BasePersonalRecordModel = types.model("BasePersonalRecordModel", {
  workoutId: types.maybe(types.string),
  datePerformed: types.Date,
  reps: types.identifierNumber, // This is 0 for time based exercises
})

// volumeType is undefined in the exercises fields of a workout document
// volumeType is defined in the personalRecords field of a user document
const RepsPersonalRecordModel = types.compose(
  "RepsPersonalRecordModel",
  BasePersonalRecordModel,
  types.model({
    volumeType: types.maybe(types.literal(ExerciseVolumeType.Reps)), // For backwards compatibility, this was added later and is not present in all documents
    // reps: types.number,
    weight: types.maybeNull(types.number),
  }),
)

const TimePersonalRecordModel = types.compose(
  "TimePersonalRecordModel",
  BasePersonalRecordModel,
  types.model({
    volumeType: types.maybe(types.literal(ExerciseVolumeType.Time)), // For backwards compatibility, this was added later and is not present in all documents
    time: types.number,
  }),
)

export const PersonalRecordModel = types.union(
  { eager: true },
  RepsPersonalRecordModel,
  TimePersonalRecordModel,
)

export type IRepsPersonalRecordModel = SnapshotOrInstance<typeof RepsPersonalRecordModel>
export type ITimePersonalRecordModel = SnapshotOrInstance<typeof TimePersonalRecordModel>
export type IPersonalRecordModel = IRepsPersonalRecordModel | ITimePersonalRecordModel
