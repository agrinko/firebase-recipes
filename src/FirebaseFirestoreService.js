import firebase from "./FirebaseConfig";

const firestore = firebase.firestore();

const createDocument = (collection, document) => {
  return firestore.collection(collection).add(document);
};

const readDocument = (collection, id) => {
  return firestore.collection(collection).doc(id).get();
};

const readDocuments = async ({
  collection,
  queries,
  orderByField,
  orderByDirection,
  perPage,
  cursorID,
}) => {
  let collectionRef = firestore.collection(collection);

  if (queries?.length > 0) {
    for (const query of queries) {
      collectionRef = collectionRef.where(
        query.field,
        query.condition,
        query.value
      );
    }
  }

  if (orderByField && orderByDirection) {
    collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
  }

  if (perPage) {
    collectionRef = collectionRef.limit(perPage);
  }

  if (cursorID) {
    const document = await readDocument(collection, cursorID);
    collectionRef = collectionRef.startAfter(document);
  }

  return collectionRef.get();
};

const updateDocument = (collection, id, document) => {
  return firestore.collection(collection).doc(id).update(document);
};

const deleteDocument = (collection, id) => {
  return firestore.collection(collection).doc(id).delete();
};

const FirebaseFirestoreService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};

export default FirebaseFirestoreService;
