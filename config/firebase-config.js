import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
//suas configuracoes do firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.firebase = { app, db };

