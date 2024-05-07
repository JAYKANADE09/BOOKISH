import { auth, db } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userId = user.uid;

                const userDataSnapshot = await get(ref(db, `users/${userId}`));
                const userData = userDataSnapshot.val();

                document.getElementById('username').textContent = `${userData.username}`;
                document.getElementById('email').textContent = `${userData.email}`;

                // Display bio if available, otherwise display nothing
                if (userData.bio) {
                    document.getElementById('bio').textContent = `${userData.bio}`;
                } else {
                    document.getElementById('bio').textContent = '';
                }

                // Display user image if available, otherwise display default image
                const userImageSrc = userData.imageUrl ? userData.imageUrl : '/assets/profile-user.png';
                document.querySelector('.user-image-container img').src = userImageSrc;

                const userBooksSnapshot = await get(ref(db, `users/${userId}/books`));
                let numBookmarks = 0;
                if (userBooksSnapshot.exists()) {
                    userBooksSnapshot.forEach(() => {
                        numBookmarks++;
                    });
                }
                document.getElementById('bookmarks').textContent = `${numBookmarks}`;
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            console.log("User Not Logged in")
        }
    });
});

