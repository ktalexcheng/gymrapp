import * as admin from "firebase-admin"

describe("create user connections", () => {
  test("create a lot follower/following relationship with 1 user", async () => {
    // Setup connection to Firebase
    const firestoreClient = admin.firestore()

    // Get a list of all the user IDs
    const allUserIds = await firestoreClient
      .collection("users")
      .get()
      .then((querySnapshot) => {
        return querySnapshot.docs.map((doc) => doc.id)
      })

    // Randomly select 100 user IDs
    const randomUserIds1 = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 100)
    const randomUserIds2 = allUserIds.sort(() => 0.5 - Math.random()).slice(0, 100)

    // Write random users to the follower and following collection for the target user
    const userId = "qKMUW3MVa0V6S5USHIHyuxRky0K3"
    for (const randomUserId of randomUserIds1) {
      await firestoreClient
        .collection("userFollows")
        .doc(userId)
        .collection("followers")
        .doc(randomUserId)
        .set({
          followDate: admin.firestore.FieldValue.serverTimestamp(),
        })
    }
    for (const randomUserId of randomUserIds2) {
      await firestoreClient
        .collection("userFollows")
        .doc(userId)
        .collection("following")
        .doc(randomUserId)
        .set({
          followDate: admin.firestore.FieldValue.serverTimestamp(),
        })
    }
  })
})
