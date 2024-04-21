import { Workout } from "app/data/types"

const workouts = {
  testWorkout1: {
    workoutId: "testWorkout1",
    byUserId: "",
    userIsPrivate: false,
    isHidden: false,
    startTime: new Date(),
    endTime: new Date(),
    exercises: [],
    workoutTitle: "",
    activityId: "",
    _createdAt: null,
    _modifiedAt: null,
  },
}

export const getWorkout = (id: keyof typeof workouts, userId: string): Workout => {
  return {
    ...workouts[id],
    __isLocalOnly: false,
    byUserId: userId,
  }
}
