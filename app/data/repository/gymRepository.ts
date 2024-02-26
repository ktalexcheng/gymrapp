import firestore from "@react-native-firebase/firestore"
import { convertFirestoreTimestampToDate } from "app/utils/convertFirestoreTimestampToDate"
import { GymDetails, GymId, GymMember } from "../types"
import { BaseRepository, RepositoryError } from "./baseRepository"

export class GymRepository extends BaseRepository<GymDetails, GymId> {
  #gymMembersCollectionName = "gymMembers"

  constructor(firestoreClient) {
    super("GymRepository", firestoreClient, "gyms", "gymId")
  }

  delete(): never {
    throw new RepositoryError(this.constructor.name, "Method not allowed.")
  }

  async getGymMembersByWorkoutsCount(
    gymId: GymId,
    lastMemberId?: string,
    limit = 20,
  ): Promise<{
    lastMemberId: string | null
    noMoreItems: boolean
    gymMembers: Array<GymMember>
  }> {
    this.checkRepositoryInitialized()

    let gymMembersQuery = this.firestoreCollection!.doc(gymId)
      .collection(this.#gymMembersCollectionName)
      .orderBy("workoutsCount", "desc")
      .orderBy("dateAdded", "desc")
      .orderBy(firestore.FieldPath.documentId(), "desc")
    if (lastMemberId) {
      gymMembersQuery = gymMembersQuery.startAfter(null, null, lastMemberId)
    }
    if (limit) {
      gymMembersQuery = gymMembersQuery.limit(limit)
    }

    try {
      const members = await gymMembersQuery.get()
      if (members.empty) {
        return {
          lastMemberId: null,
          noMoreItems: true,
          gymMembers: [],
        }
      }

      const newLastMemberId = members.docs[members.docs.length - 1].id
      const noMoreItems = members.docs.length < limit

      return {
        lastMemberId: newLastMemberId,
        noMoreItems,
        gymMembers: members.docs.map((doc) => convertFirestoreTimestampToDate(doc.data())),
      }
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `getGymMembers error: ${e}`)
    }
  }

  async getGymMember(gymId: GymId, userId: string): Promise<GymMember> {
    this.checkRepositoryInitialized()

    try {
      const gymMemberDoc = await this.firestoreCollection!.doc(gymId)
        .collection(this.#gymMembersCollectionName)
        .doc(userId)
        .get()
      if (!gymMemberDoc.exists) {
        throw new RepositoryError(this.repositoryId, `GymMember not found: ${userId}`)
      }

      return convertFirestoreTimestampToDate(gymMemberDoc.data())
    } catch (e) {
      throw new RepositoryError(this.repositoryId, `getGymMember error: ${e}`)
    }
  }
}
