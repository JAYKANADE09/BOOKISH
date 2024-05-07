//Google Authentication
import { auth } from "./firebaseConfig.mjs";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const user = auth.currentUser;

function updateUserProfile(user) {
  const userName = user.displayName;
  const userEmail = user.email;
  console.log(userEmail);
  document.getElementById("userName").textContent = userName;
  document.getElementById("userEmail").textContent = userEmail;
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    updateUserProfile(user);
    const uid = user.uid;
    return uid;
  } else {
    alert("Create Account & Login");
  }
});
