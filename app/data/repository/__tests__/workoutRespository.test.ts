import { WorkoutRepository } from "../workoutRepository"

const mockFirebaseClient = jest.fn()

describe("WorkoutRepository", () => {
  let workoutRepository: WorkoutRepository
  let storage: Storage

  beforeEach(() => {
    storage = new Storage()
    workoutRepository = new WorkoutRepository(mockFirebaseClient)
  })

  it("should upload all local workouts", async () => {
    const mockWorkouts = [
      {
        workoutId: "",
      },
    ]
    const mockSaveWorkout = jest.fn()
    const mockDeleteData = jest.fn()

    workoutRepository.getAllLocalWorkouts = jest.fn().mockResolvedValue(mockWorkouts)
    workoutRepository.saveWorkout = mockSaveWorkout
    storage.deleteData = mockDeleteData

    await workoutRepository.uploadAllLocalWorkouts()

    expect(workoutRepository.getAllLocalWorkouts).toBeCalled()
    expect(mockSaveWorkout).toBeCalledTimes(mockWorkouts.length)
    expect(mockDeleteData).toBeCalledTimes(mockWorkouts.length + 1) // +1 for the deletion of the list key
  })
})
