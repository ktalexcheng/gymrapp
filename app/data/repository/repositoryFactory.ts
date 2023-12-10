import firestore from "@react-native-firebase/firestore"
import { ActivityRepository } from "./activityRepository"
import { ExerciseRepository } from "./exerciseRepository"
import { FeedRepository } from "./feedRepository"
import { GymRepository } from "./gymRepository"
import { NotificationRepository } from "./notificationRepository"
import { PrivateExerciseRepository } from "./privateExerciseRepository"
import { UserRepository } from "./userRepository"
import { WorkoutInteractionRepository } from "./workoutInteractionRepository"
import { WorkoutRepository } from "./workoutRepository"

export const repositoryFactory = (firebaseClient) => {
  return {
    activityRepository: new ActivityRepository(firebaseClient),
    workoutRepository: new WorkoutRepository(firebaseClient),
    feedRepository: new FeedRepository(firebaseClient),
    userRepository: new UserRepository(firebaseClient),
    exerciseRepository: new ExerciseRepository(firebaseClient),
    privateExerciseRepository: new PrivateExerciseRepository(firebaseClient),
    workoutInteractionRepository: new WorkoutInteractionRepository(firebaseClient),
    gymRepository: new GymRepository(firebaseClient),
    notificationRepository: new NotificationRepository(firebaseClient),
  }
}

export const repositorySingletons = repositoryFactory(firestore())
