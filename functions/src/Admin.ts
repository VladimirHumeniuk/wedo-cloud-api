import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const getUserByEmail = functions.https.onCall((data, context) => {
  const email = data.email

  return admin.auth().getUserByEmail(email)
})