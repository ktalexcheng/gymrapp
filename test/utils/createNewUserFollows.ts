import * as firestore from "@google-cloud/firestore"
import { MockRootStore } from "test/utils/mockRootStore"

export async function createNewUserFollows(
  firestoreClient: firestore.Firestore,
  rootStore: MockRootStore,
  followerEmail: string,
  followeeEmail: string,
) {
  const { userStore } = rootStore
  const followerSnapshot = await firestoreClient
    .collection("usersPrivate")
    .where("email", "==", followerEmail)
    .limit(1)
    .get()
  const followerUserId = followerSnapshot.docs[0].id
  userStore.loadUserWithId(followerUserId)

  const followeeSnapshot = await firestoreClient
    .collection("usersPrivate")
    .where("email", "==", followeeEmail)
    .limit(1)
    .get()
  const followeeUserId = followeeSnapshot.docs[0].id
  await userStore.followUser(followeeUserId)
}
