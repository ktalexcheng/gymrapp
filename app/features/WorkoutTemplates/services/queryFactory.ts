import { createQueryKeys } from "@lukemorales/query-key-factory"
import { workoutTemplateRepository } from "app/data/repository"

export const queries = createQueryKeys("workoutTemplates", {
  get: (workoutTemplateId: string) => ({
    queryKey: [workoutTemplateId],
    queryFn: () => workoutTemplateRepository.get(workoutTemplateId),
  }),
  getAll: (userId: string) => ({
    queryKey: [userId],
    queryFn: () =>
      workoutTemplateRepository.getByFilter({
        whereConditions: [["createdByUserId", "==", userId]],
        orderBy: [{ field: "_createdAt", direction: "desc" }],
      }),
  }),
})
