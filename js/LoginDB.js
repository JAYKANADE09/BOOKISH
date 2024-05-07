import { db, auth } from "./firebaseConfig.mjs";
import {
  set,
  ref,
  update,
  getDatabase,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

function updateUserDisplayName(user) {
  const userNameElement = document.getElementById("user-name");
  if (userNameElement) {
    userNameElement.textContent = user.displayName ?? "User Name";
  }
}

async function login(event) {
  event.preventDefault();
  const email = document.getElementById("Email_TextBox").value;
  const password = document.getElementById("Password_TextBox").value;

  // Check if email or password is empty
  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    alert("Login successfully");
    sessionStorage.setItem('user', JSON.stringify(user));
    window.location.href = `/index.html?userId=${user.uid}`;
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please check your email and password.");
  }
}

document.getElementById("Login_Btn").addEventListener("click", login);

function logout() {
  sessionStorage.removeItem('user');
  auth.signOut().then(() => {
    window.location.href = "/html/Login.html";
  }).catch((error) => {
    console.error("Logout error:", error);
    alert("Logout failed.");
  });
}

document.getElementById("logout-link").addEventListener("click", logout);

const currentUser = sessionStorage.getItem('user');
if (currentUser) {
  const user = JSON.parse(currentUser);
  updateUserDisplayName(user);
}

document.getElementById("Login_Btn").addEventListener("click", login);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  login_hint: "user@example.com",
});

async function loginOAuth() {
  try {
    const authData = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(authData);
    const token = credential.accessToken;
    const user = authData.user;

    await set(ref(db, `users/${user.uid}`), {
      username: user?.displayName ?? "google",
      email: user?.email,
      password: "bookish@123",
    });

    alert("Login successfully");
    window.location.href = `/index.html?userId=${user.uid}`;
  } catch (error) {
    console.error("OAuth login error:", error);
    alert(error.code);
  }
}

document.getElementById("google-login-btn").addEventListener("click", loginOAuth);

document.addEventListener("DOMContentLoaded", function () {
  const userToggleBtn = document.getElementById("user-toggle-btn");
  const adminToggleBtn = document.getElementById("admin-toggle-btn");
  const userLoginForm = document.querySelector(".user-login-form");
  const adminLoginForm = document.querySelector(".admin-login-form");

  // Function to toggle between user and admin login forms
  function toggleForms(isAdmin) {
    userLoginForm.style.display = isAdmin ? "none" : "block";
    adminLoginForm.style.display = isAdmin ? "block" : "none";
  }

  // Event listener for user toggle button
  userToggleBtn.addEventListener("click", function () {
    toggleForms(false); 
  });

  // Event listener for admin toggle button
  adminToggleBtn.addEventListener("click", function () {
    toggleForms(true); 
  });

  // Event listener for admin login button
  document.getElementById("AdminLogin_Btn").addEventListener("click", async function (event) {
    event.preventDefault();
    const secretKey = document.getElementById("AdminSecretKey_TextBox").value;

    // Authenticate with Firebase using email and password
    const email = document.getElementById("AdminEmail_TextBox").value;
    const password = document.getElementById("AdminPassword_TextBox").value;

    // Check if email or password is empty
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // If authentication is successful, proceed to check the secret key
      if (secretKey === "adminkey") {
        // Update user role to admin
        await update(ref(getDatabase(), `users/${user.uid}`), { role: "admin" });
        sessionStorage.setItem('user', JSON.stringify(user));
        alert("Login successfully");
        window.location.href = `/index.html?userId=${user.uid}&role=admin`;
      } else {
        alert("Invalid secret key. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your email and password.");
    }
  });
});


const rmCheck = document.getElementById("remember_me");
const emailInput = document.getElementById("Email_TextBox");

if (localStorage.checkbox && localStorage.checkbox !== "") {
  rmCheck.setAttribute("checked", "checked");
  emailInput.value = localStorage.username;
} else {
  rmCheck.removeAttribute("checked");
  emailInput.value = "";
}

function lsRememberMe() {
  if (rmCheck.checked && emailInput.value !== "") {
    localStorage.username = emailInput.value;
    localStorage.checkbox = "checked";
  } else {
    localStorage.username = "";
    localStorage.checkbox = "";
  }
}

rmCheck.addEventListener("change", lsRememberMe);

