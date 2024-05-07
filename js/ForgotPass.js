import { auth } from "./firebaseConfig.mjs";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

async function forget_password(e) {
  const email = document.getElementById("email").value;
  e.preventDefault();

  // Check if email field is empty
  if (email.trim() === '') {
    alert("Please enter your email address");
    return;
  }

  // Validate email format
  if (!email.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)) {
    alert("Invalid email format");
    return;
  }

  // Validate email to be gmail.com format
  if (!email.match(/[a-z0-9._%+-]+@gmail\.com$/i)) {
    alert("Email must be in gmail.com format");
    return;
  }

  sendPasswordResetEmail(auth, email)
    .then(() => {
      alert("Check your email to reset the password!");
      window.location.href = "/html/Login.html";
    })
    .catch((err) => {
      alert("Something went wrong: " + err.code);
    });
}

document
  .getElementById("forget-pass-btn")
  .addEventListener("click", function (event) {
    forget_password(event);
  });
