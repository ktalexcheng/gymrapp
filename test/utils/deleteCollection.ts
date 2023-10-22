import { firestore } from "firebase-admin"

export const deleteCollection = async (
  firestoreClient: firestore.Firestore,
  collectionPath: string,
) => {
  const collectionRef = firestoreClient.collection(collectionPath)
  const documents = await collectionRef.listDocuments()
  for (const doc of documents) {
    await doc.delete()
  }
}
