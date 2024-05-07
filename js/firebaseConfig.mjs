import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzS2i7jZCEmfVvxjppuHc3iYphjR0hWsM",
  authDomain: "bookish-5a9b1.firebaseapp.com",
  projectId: "bookish-5a9b1",
  storageBucket: "bookish-5a9b1.appspot.com",
  messagingSenderId: "1023691064931",
  appId: "1:1023691064931:web:b9ba0ba5bea49e3fec9a56",
  measurementId: "G-C5EFS5WL7G"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);