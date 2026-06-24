const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyCvXo7_BOOHgs1psB3wweXgl8n1_esGPmQ",
    authDomain: "sunday-school-8cde8.firebaseapp.com",
    projectId: "sunday-school-8cde8",
    storageBucket: "sunday-school-8cde8.firebasestorage.app",
    messagingSenderId: "922341060283",
    appId: "1:922341060283:web:5cd86a8f5cb672f73ac39e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function list() {
  try {
    const colRef = collection(db, "word_of_life");
    const snapshot = await getDocs(colRef);
    console.log(JSON.stringify(snapshot.docs.map(d => ({ id: d.id, ...d.data() })), null, 2));
  } catch (err) {
    console.error(err);
  }
}

list();
