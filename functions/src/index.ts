import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// const corsHandler = require('cors')({origin: true});
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const getUserByEmail = functions.https.onCall((data, context) => {
  const email = data.email
  let response

  admin.auth().getUserByEmail(email)
    .then(user => {
      response = user

      console.log('user', user)
    })
    .catch(error => {
      return error
    })

    return response
})