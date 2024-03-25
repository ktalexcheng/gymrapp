import { AppColorScheme, AppLocale, DefaultUserPreferences, WeightUnit } from "app/data/constants"
import { NotificationType } from "app/data/types"
import { SnapshotOrInstance, types } from "mobx-state-tree"
import { convertUserToMSTSnapshot } from "../helpers/convertUserToMSTSnapshot"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { MetadataModel } from "./MetadataModel"
import { PersonalRecordModel } from "./PersonalRecordModel"

const GymModel = types.compose(
  "GymModel",
  MetadataModel,
  types.model({
    gymId: types.identifier,
    gymName: types.string,
  }),
)

export const ExerciseSettingsModel = types
  .model("ExerciseSettingsModel", {
    exerciseId: types.identifier,
    weightUnit: types.maybeNull(types.enumeration("WeightUnit", Object.values(WeightUnit))),
    autoRestTimerEnabled: types.maybeNull(types.boolean),
    restTime: types.maybeNull(types.number),
  })
  .actions(withSetPropAction)

const UserPreferencesModel = types.model("UserPreferencesModel", {
  appLocale: types.optional(
    types.enumeration("AppLocale", Object.values(AppLocale)),
    DefaultUserPreferences.appLocale,
  ),
  weightUnit: types.optional(
    types.enumeration("WeightUnit", Object.values(WeightUnit)),
    DefaultUserPreferences.weightUnit,
  ),
  autoRestTimerEnabled: types.optional(types.boolean, DefaultUserPreferences.autoRestTimerEnabled),
  restTime: types.optional(types.number, DefaultUserPreferences.restTime),
  exerciseSpecificSettings: types.map(ExerciseSettingsModel),
  appColorScheme: types.optional(
    types.enumeration("AppColorScheme", Object.values(AppColorScheme)),
    DefaultUserPreferences.appColorScheme,
  ),
})

const WorkoutMetaModel = types.model("WorkoutMetaModel", {
  workoutId: types.identifier,
  startTime: types.Date,
})

const PersonalRecordsMapModel = types.map(
  types.model({
    reps: types.identifierNumber,
    // TODO: This is different to the schema in Firebase and will require conversion
    // Firebase schema is [reps]: record[], but this is not possible with MST
    records: types.array(PersonalRecordModel),
  }),
)

const ExerciseHistoryModel = types.model("ExerciseHistoryModel", {
  exerciseId: types.identifier,
  performedWorkoutIds: types.array(types.string),
  personalRecords: PersonalRecordsMapModel,
})

export const UserModel = types.snapshotProcessor(
  types.compose(
    "UserModel",
    MetadataModel,
    types.model({
      userId: types.identifier,
      userHandle: types.maybe(types.string),
      _userHandleLower: types.maybe(types.string),
      email: types.string,
      firstName: types.string,
      lastName: types.string,
      privateAccount: types.boolean,
      providerId: types.string,
      myGyms: types.array(GymModel),
      preferences: UserPreferencesModel,
      avatarUrl: types.maybeNull(types.string),
      workoutMetas: types.map(WorkoutMetaModel),
      exerciseHistory: types.map(ExerciseHistoryModel),
      followersCount: types.maybeNull(types.number),
      followingCount: types.maybeNull(types.number),
    }),
  ),
  {
    preProcessor: (snapshot: any) => {
      if (snapshot.isMSTInterface) return snapshot

      try {
        return convertUserToMSTSnapshot(snapshot)
      } catch {
        return snapshot
      }
    },
    postProcessor: (snapshot) => {
      return { ...snapshot, isMSTInterface: true }
    },
  },
)

export const BaseNotificationModel = types.model("BaseNotificationModel", {
  notificationId: types.identifier,
  notificationDate: types.Date,
  isRead: types.boolean,
  senderUserId: types.string,
})

export const WorkoutNotificationModel = types.compose(
  "WorkoutNotificationModel",
  BaseNotificationModel,
  types.model({
    notificationType: types.union(
      { eager: false },
      types.literal(NotificationType.Comment),
      types.literal(NotificationType.Like),
    ),
    workoutId: types.string,
  }),
)

export const FollowNotificationModel = types.compose(
  "FollowNotificationModel",
  BaseNotificationModel,
  types.model({
    notificationType: types.union(
      { eager: false },
      types.literal(NotificationType.FollowAccepted),
      types.literal(NotificationType.FollowRequest),
    ),
  }),
)

export const NotificationModel = types.union(
  { eager: false },
  WorkoutNotificationModel,
  FollowNotificationModel,
)

export const FollowRequestsModel = types.model("FollowRequestsModel", {
  requestId: types.identifier,
  requestedByUserId: types.string,
  requestDate: types.Date,
  isAccepted: types.boolean,
  isDeclined: types.boolean,
})

export type IGymModel = SnapshotOrInstance<typeof GymModel>
export type IExerciseSettingsModel = SnapshotOrInstance<typeof ExerciseSettingsModel>
export type IUserPreferencesModel = SnapshotOrInstance<typeof UserPreferencesModel>
export type IWorkoutMetaModel = SnapshotOrInstance<typeof WorkoutMetaModel>
export type IExerciseHistoryModel = SnapshotOrInstance<typeof ExerciseHistoryModel>
export type IPersonalRecordsMapModel = SnapshotOrInstance<typeof PersonalRecordsMapModel>
export type IUserModel = SnapshotOrInstance<typeof UserModel>
export type INotificationModel = SnapshotOrInstance<typeof NotificationModel>
export type IFollowRequestsModel = SnapshotOrInstance<typeof FollowRequestsModel>
