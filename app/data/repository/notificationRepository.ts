import { Notification, NotificationId } from "../types"
import { BaseRepository } from "./baseRepository"

export class NotificationRepository extends BaseRepository<Notification, NotificationId> {
  constructor(firestoreClient) {
    super("NotificationRepository", firestoreClient, null, "notificationId")
  }

  setUserId(userId: string): void {
    super.setCollectionPath(`notifications/${userId}/inbox`)
  }
}
