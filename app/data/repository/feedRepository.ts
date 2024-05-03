// Repository for feed data

import { FeedItemId, UserFeedItem, WorkoutComment } from "../types"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class FeedRepository extends BaseRepository<UserFeedItem, FeedItemId> {
  #userId?: string

  constructor(firestoreClient) {
    super("FeedRepository", firestoreClient, null, "feedItemId")
  }

  setUserId(userId?: string): void {
    this.#userId = userId
    super.setCollectionPath(userId ? `feeds/${userId}/feedItems` : undefined)
  }

  create(): never {
    throw new RepositoryError(this.repositoryId, "Method not allowed.")
  }

  delete(): never {
    throw new RepositoryError(this.repositoryId, "Method not allowed.")
  }

  async reportComment(
    workoutId: string,
    comment: Partial<WorkoutComment>,
    reasons: string[],
    otherReason?: string,
  ): Promise<void> {
    const violationsCommentsColl = this.firestoreClient.collection(`violations/comments/reports`)
    const reportData: any = {
      reportedAt: new Date(),
      workoutId,
      commentId: comment.commentId,
      comment,
      reasons,
    }
    if (otherReason) reportData.otherReason = otherReason

    try {
      await violationsCommentsColl.add(reportData)
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `reportComment error: ${e}`)
    }
  }
}
