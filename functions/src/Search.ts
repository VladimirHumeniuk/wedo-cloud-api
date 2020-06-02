import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

const db = admin.firestore();

const env = functions.config()

const client = algoliasearch(env.algolia.appid, env.algolia.apikey);
const collectionIndex = client.initIndex('companies_search');

export const sendCollectionToAlgolia = functions.runWith({ memory: '2GB', timeoutSeconds: 360 }).https.onRequest(async (req, res) => {
  const algoliaRecords: any[] = [];

  const querySnapshot = await db.collection('companies').get();

  querySnapshot.docs.forEach(doc => {
    const document = doc.data();

    if (!document.isShown) return

    const record = {
      objectID: doc.id,
      title: document.title,
      date: document.created._seconds,
      shortDescription: document.shortDescription,
      category: document.category,
      image: document.image,
      rating: document.rating
    };

    algoliaRecords.push(record);
  });

  collectionIndex.saveObjects(algoliaRecords, (_error: any, content: any) => {
    res.status(200).send("Companies was indexed to Algolia successfully.");
  });
});

export const collectionOnCreate = functions.firestore.document('companies/{uid}').onCreate(async (snapshot, context) => {
  await saveDocumentInAlgolia(snapshot);
});

export const collectionOnUpdate = functions.firestore.document('companies/{uid}').onUpdate(async (change, context) => {
  const before = change.before.data() || {}
  const after = change.after.data() || {}

  const watch = [
    'title',
    'shortDescription',
    'category',
    'image',
    'rating',
    'isShown'
  ]

  for (let i = 0; i < watch.length; ++i) {
    if (before[watch[i]] !== after[watch[i]]) {
      await updateDocumentInAlgolia(change);
      break;
    }
  }
});

export const collectionOnDelete = functions.firestore.document('companies/{uid}').onDelete(async (snapshot, context) => {
  await deleteDocumentFromAlgolia(snapshot);
});

async function saveDocumentInAlgolia(snapshot: any) {
  if (snapshot.exists) {
      const record = snapshot.data();
      if (record) {
        const data = {
          objectID: snapshot.id,
          title: record.title,
          date: record.created._seconds,
          shortDescription: record.shortDescription,
          category: record.category,
          image: record.image,
          rating: record.rating
        }

        if (record.isShown) {
          await collectionIndex.saveObject(data);
        } else {
          await deleteDocumentFromAlgolia(snapshot)
        }
      }
  }
}

async function updateDocumentInAlgolia(change: functions.Change<FirebaseFirestore.DocumentSnapshot>) {
  await saveDocumentInAlgolia(change.after);
}

async function deleteDocumentFromAlgolia(snapshot: FirebaseFirestore.DocumentSnapshot) {
  if (snapshot.exists) {
      const objectID = snapshot.id;
      await collectionIndex.deleteObject(objectID);
  }
}