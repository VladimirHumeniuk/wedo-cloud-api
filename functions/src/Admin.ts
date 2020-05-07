import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp()

export const getUserByEmail = functions.https.onCall((data, context) => {
  const email = data.email

  return admin.auth().getUserByEmail(email)
})

export const setUserRoles = functions.https.onCall((data, context) => {
  const { uid, roles } = data

  return admin.auth().setCustomUserClaims(uid, roles)
})