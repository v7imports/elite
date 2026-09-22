// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHXK2yV8ZliQCYU3LSGnmJmWe2gZ-8IMc",
  authDomain: "v7imports.firebaseapp.com",
  projectId: "v7imports",
  storageBucket: "v7imports.firebasestorage.app",
  messagingSenderId: "313801918256",
  appId: "1:313801918256:web:7362aa27dbcad009ba2af5"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Cria os serviços que o projeto utiliza
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();