import { Notification, NotificationId } from "../model"
import { BaseRepository } from "./baseRepository"

export class NotificationRepository extends BaseRepository<Notification, NotificationId> {
  constructor(firestoreClient) {
    super("NotificationRepository", firestoreClient, undefined, "notificationId")
  }

  setUserId(userId: string): void {
    super.setCollectionPath(`notifications/${userId}/inbox`)
  }
}
