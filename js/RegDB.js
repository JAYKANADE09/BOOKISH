import { auth, db } from "./firebaseConfig.mjs";

import {
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

console.log(db);

async function register(event) {
  const email = document.getElementById("Email_TextBox").value;
  const password = document.getElementById("Password_TextBox").value;
  const username = document.getElementById("Username_TextBox").value;
  const termsCheckbox = document.querySelector('.TandC input[type="checkbox"]');
  const errorMessage = document.getElementById("error-message");
  event.preventDefault();

  // Check if any required field is empty
  if (email.trim() === '' || password.trim() === '' || username.trim() === '') {
    alert("Please fill in all required fields");
    return;
  }

  // Validate email format
  if (!email.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)) {
    alert("Invalid email format");
    return;
  }

  // Validate username length
  if (username.trim().length < 3) {
    alert("Username must be at least 3 characters long");
    return;
  }

  // Validate password format
  if (!/(?=.*[a-z])/.test(password)) {
    alert("Password must contain at least 1 lowercase letter");
    return;
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    alert("Password must contain at least 1 uppercase letter");
    return;
  }

  if (!/(?=.*\d)/.test(password)) {
    alert("Password must contain at least 1 number");
    return;
  }

  if (!/(?=.*[!@#$%^&*()])/.test(password)) {
    alert("Password must contain at least 1 symbol");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long");
    return;
  }


  const confirmPassword = document.getElementById("Confirm_Password_TextBox").value;

  // Validate confirm password
  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  // Validate checkbox
  if (!termsCheckbox.checked) {
    alert('Please accept the terms and conditions')
    return;
  }

  try {
    const authData = await createUserWithEmailAndPassword(auth, email, password);

    await set(ref(db, `users/${authData.user.uid}`), {
      username,
      email,
      password,
    });

    alert("Registration Successful!");
    window.location.href = "/html/Login.html";
  } catch (error) {
    console.error("Error during registration:", error.message);
    alert('User not Registered. Please Enter Valid Information');
  }
}



document
  .getElementById("Register_Button")
  .addEventListener("click", function (event) {
    register(event);
  });
