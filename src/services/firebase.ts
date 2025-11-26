import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCvXo7_BOOHgs1psB3wweXgl8n1_esGPmQ",
    authDomain: "sunday-school-8cde8.firebaseapp.com",
    projectId: "sunday-school-8cde8",
    storageBucket: "sunday-school-8cde8.firebasestorage.app",
    messagingSenderId: "922341060283",
    appId: "1:922341060283:web:5cd86a8f5cb672f73ac39e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
