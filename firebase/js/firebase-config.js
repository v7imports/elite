console.log(">>> firebase-config.js FOI CARREGADO <<<");

const firebaseConfig = {
  apiKey: "AIzaSyDHXK2yV8ZliQCYU3LSGnmJmWe2gZ-8IMc",
  authDomain: "v7imports.firebaseapp.com",
  projectId: "v7imports",
  storageBucket: "v7imports.firebasestorage.app",
  messagingSenderId: "313801918256",
  appId: "1:313801918256:web:7362aa27dbcad009ba2af5"
};

console.log("Firebase disponível:", typeof firebase);

firebase.initializeApp(firebaseConfig);

console.log("Firebase inicializado:", firebase);

window.auth = firebase.auth();
window.db = firebase.firestore();

console.log("AUTH CRIADO:", window.auth);
console.log("DB CRIADO:", window.db);