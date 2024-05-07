import { db, auth } from "./firebaseConfig.mjs";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', async () => {
    const profileLink = document.getElementById('profile-link');
    const settingsLink = document.getElementById('settings-link');
    const helpsServicesLink = document.getElementById('helps-services-link');
    const logoutLink = document.getElementById('logout-link');
    const loginLink = document.getElementById('login-link');
    const userImage = document.getElementById('user-image');
    const userName = document.getElementById('user-name');
    const menu = document.querySelector('.menu');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            loginLink.style.display = 'none';
            logoutLink.style.display = 'flex';
            const userId = user.uid;
            const userRef = ref(db, `users/${userId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            if (userData) {
                userImage.src = userData.imageUrl || '/assets/person-circle.svg'; 
                userName.textContent = userData.username || 'User';
                const isSubscribed = userData.subscribeduser === true;
                profileLink.style.display = 'flex';
                settingsLink.style.display = 'flex';
                helpsServicesLink.style.display = 'flex';
                if (isSubscribed) {
                    createMenuLink('Create', '/html/authordashboard.html', 'showMenu(2)');
                } else {
                    createMenuLink('Subscribe', '/html/subscriptionplan.html', '');
                }
                if (userData.role === 'admin') {
                    createMenuLink('Admin', '/html/admin.html', '');
                }
            }
        } else {
            loginLink.style.display = 'flex';
            logoutLink.style.display = 'none';
            profileLink.style.display = 'none';
            settingsLink.style.display = 'none';
            helpsServicesLink.style.display = 'none';
        }
    });

    // Function to create menu link
    function createMenuLink(text, href, onclick) {
        const link = document.createElement('a');
        link.textContent = text;
        link.href = href;
        link.setAttribute('onclick', onclick);
        link.classList.add('nav-link');
        menu.appendChild(link);
    }

    document.getElementById("logout-link").addEventListener("click", logout);

    function logout() {
        sessionStorage.removeItem('user');

        auth.signOut().then(() => {
            window.location.href = "/html/Login.html";
        }).catch((error) => {
            console.error("Logout error:", error.message);
            alert("Logout failed.");
        });
    }

    function toggleIcon() {
        const subMenu = document.getElementById('subMenu');
        subMenu.classList.toggle('active');
    }
});
