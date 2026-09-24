
const firebaseConfig = {
  apiKey: "AIzaSyDHXK2yV8ZliQCYU3LSGnmJmWe2gZ-8IMc",
  authDomain: "v7imports.firebaseapp.com",
  projectId: "v7imports",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const storage = firebase.storage();