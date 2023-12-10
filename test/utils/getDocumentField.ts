import { firestore } from "firebase-admin"

export const getDocumentField = async (
  firestoreClient: firestore.Firestore,
  collection: string,
  docId: string,
  field: string,
) => {
  const docRef = firestoreClient.collection(collection).doc(docId)
  const doc = await docRef.get()
  return doc.get(field)
}
