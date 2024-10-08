import * as admin from "firebase-admin"
import { RootStore } from "../../app/stores/RootStore"

export async function createNewUserFollows(
  firestoreClient: admin.firestore.Firestore,
  rootStore: RootStore,
  followerEmail: string,
  followeeEmail: string,
) {
  const { userStore } = rootStore
  const followerSnapshot = await firestoreClient
    .collection("users")
    .where("email", "==", followerEmail)
    .limit(1)
    .get()
  const followerUserId = followerSnapshot.docs[0].id
  userStore.loadUserWithId(followerUserId)

  const followeeSnapshot = await firestoreClient
    .collection("users")
    .where("email", "==", followeeEmail)
    .limit(1)
    .get()
  const followeeUserId = followeeSnapshot.docs[0].id
  await userStore.followUser(followeeUserId)
}
