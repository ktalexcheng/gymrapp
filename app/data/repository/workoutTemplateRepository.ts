import firestore from "@react-native-firebase/firestore"
import { ActivityType, ExerciseSource } from "app/data/constants"
import { BaseRepositoryV2 } from "app/data/repository/baseRepositoryV2"
import { ExerciseId, ExerciseSetPerformed } from "app/data/types/exercise.types"
import { baseMetadata } from "../types"

type TemplateSet = Omit<ExerciseSetPerformed, "isCompleted" | "isNewRecord">

interface TemplateExercise {
  exerciseId: ExerciseId
  exerciseSource: ExerciseSource
  exerciseName: string // If the exercise is private from another user, it won't be in the target user's exercise list, so we need to store this to display exercise summary
  exerciseOrder: number
  sets: TemplateSet[]
  exerciseNotes?: string | null
}

export interface WorkoutTemplate extends baseMetadata {
  workoutTemplateId: string
  activityId: ActivityType
  createdByUserId: string
  workoutTemplateName: string
  createdFromWorkoutId?: string
  createdFromUserId?: string
  exercises: TemplateExercise[]
  workoutTemplateNotes?: string
}

export type NewWorkoutTemplate = Omit<
  WorkoutTemplate,
  "workoutTemplateId" | "__isLocalOnly" | "_createdAt" | "_modifiedAt"
>

export const workoutTemplateRepository = new BaseRepositoryV2<WorkoutTemplate, string>(
  "WorkoutInteractionRepository",
  firestore(),
  "workoutTemplates",
  "workoutTemplateId",
)
