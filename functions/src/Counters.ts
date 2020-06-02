import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Refs
const totalCounter      = db.collection('counters').doc('companies-total')
const publishedCounter  = db.collection('counters').doc('companies-published')
const categoriesCounterRef = db.collection('counters').doc('companies-by-categories')

const categoriesCounter = (category: any) => {
  return categoriesCounterRef.collection('categories').doc(`${category}`)
}

export const companyOnCreate = functions.firestore.document('companies/{cid}').onCreate(async (snapshot, context) => {
  const data = snapshot.data() || {}

  await updateCounter(totalCounter, 5, 1)

  if (data.isShown) {
    await updateCounter(publishedCounter, 5, 1)
  }
});

export const companyOnUpdate = functions.firestore.document('companies/{cid}').onUpdate(async (change, context) => {
  const before = change.before.data() || {}
  const after = change.after.data() || {}

  if (before.category !== after.category) {
    await updateCounter(categoriesCounter(before.category), 5, -1)
    await updateCounter(categoriesCounter(after.category), 5, 1)
  }

  if (before.isShown !== after.isShown) {
    const isShown = after.isShown ? 1 : -1
    await updateCounter(publishedCounter, 5, isShown)
  }
});

export const companyOnDelete = functions.firestore.document('companies/{cid}').onDelete(async (snapshot, context) => {
  const data = snapshot.data() || {}

  await updateCounter(totalCounter, 5, -1)

  if (data.isShown) {
    await updateCounter(publishedCounter, 5, -1)
  }
});

async function updateCounter(
  ref: any,
  num_shards: number,
  val: number
) {
  const shard_id = Math.floor(Math.random() * num_shards).toString();
  const shard_ref = ref.collection('shards').doc(shard_id);

  return shard_ref.set({
    'count': admin.firestore.FieldValue.increment(val)
  }, { merge: true });
}