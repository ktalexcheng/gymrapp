import { ExerciseVolumeType } from "app/data/constants"
import { SnapshotOrInstance, types } from "mobx-state-tree"

const BasePersonalRecordModel = types.model("BasePersonalRecordModel", {
  // workoutId will not be available in the newRecords field in the workout document
  // and should be inferred from the parent workout document, but workoutId
  // will be included in the exerciseHistory field in the user's document
  workoutId: types.maybeNull(types.string),
  datePerformed: types.Date,
  reps: types.identifierNumber, // This is 0 for time based exercises
})

// volumeType is undefined in the exercises fields of a workout document
// volumeType is defined in the personalRecords field of a user document
export const RepsPersonalRecordModel = types.compose(
  "RepsPersonalRecordModel",
  BasePersonalRecordModel,
  types.model({
    // For backwards compatibility, volumeType was added later and is not present in all documents
    volumeType: types.maybeNull(types.literal(ExerciseVolumeType.Reps)),
    weight: types.maybeNull(types.number),
  }),
)

export const TimePersonalRecordModel = types.compose(
  "TimePersonalRecordModel",
  BasePersonalRecordModel,
  types.model({
    // For backwards compatibility, volumeType was added later and is not present in all documents
    volumeType: types.maybeNull(types.literal(ExerciseVolumeType.Time)),
    time: types.number,
    // reps is always 0 for time based exercises
    reps: types.optional(types.identifierNumber, 0),
  }),
)

export const PersonalRecordModel = types.union(
  { eager: true }, // eager: true in this case to deal with the volumeType field
  RepsPersonalRecordModel,
  TimePersonalRecordModel,
)

export type IRepsPersonalRecordModel = SnapshotOrInstance<typeof RepsPersonalRecordModel>
export type ITimePersonalRecordModel = SnapshotOrInstance<typeof TimePersonalRecordModel>
export type IPersonalRecordModel = IRepsPersonalRecordModel | ITimePersonalRecordModel
