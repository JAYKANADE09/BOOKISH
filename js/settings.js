import { db, auth } from "./firebaseConfig.mjs";
import {
    ref,
    onValue,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";


document.addEventListener('DOMContentLoaded', () => {
    const editProfileImageContainer = document.getElementById('editProflileImageContainer');
    const editProfilePlaceholder = document.getElementById('editprofileplaceholder');
    const editProfileUploadedImage = document.getElementById('editprofileuploadedImage');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const publicName = document.getElementById('publicName');
    const bio = document.getElementById('bio');
    const editPublicNameBtn = document.getElementById('editPublicName');
    const editBioBtn = document.getElementById('editBio');
    const saveChangesBtn = document.getElementById('saveChanges');
    const imageUpload = document.getElementById('editprofileInput');

    // Function to display user information
    function displayUserInfo(userData) {
        username.textContent = userData.username;
        email.textContent = userData.email;
        publicName.value = userData.username;
        bio.value = userData.bio || '';
        if (userData.imageUrl) {
            editProfileImageContainer.style.backgroundImage = `url('${userData.imageUrl}')`;
            editProfileImageContainer.style.backgroundSize = '200px 200px';
            editProfilePlaceholder.style.display = 'none';
            editProfileUploadedImage.style.display = 'block';
        } else {
            editProfileImageContainer.style.backgroundImage = `url('/assets/profile-user.png')`;
            editProfileImageContainer.style.backgroundSize = '200px 200px';
            editProfilePlaceholder.style.display = 'block';
            editProfileUploadedImage.style.display = 'none';
        }
    }

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (!file) {
            // If no file is selected, remove the image data from the database
            const userId = auth.currentUser.uid;
            const userRef = ref(db, `users/${userId}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.imageUrl) {
                    delete userData.imageUrl; 
                    set(userRef, userData)
                        .then(() => console.log("User image removed successfully."))
                        .catch((error) => console.error("Error removing user image:", error));
                }
            });
            // Reset image container to display placeholder
            editProfileImageContainer.style.backgroundImage = `url('/assets/profile-user.png')`;
            editProfileImageContainer.style.backgroundSize = '200px 200px';
            editProfilePlaceholder.style.display = 'block';
            editProfileUploadedImage.style.display = 'none';
            return; 
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;

            if (!isValidImageFile(file)) {
                alert("Please upload a valid image file (PNG, JPG, or SVG).");
                return;
            }
            if (!isValidImageSize(file)) {
                alert("Please upload an image file less than 5MB in size.");
                return;
            }

            editProfileImageContainer.style.backgroundImage = `url('${imageUrl}')`;
            editProfileImageContainer.style.backgroundSize = '200px 200px';
            editProfilePlaceholder.style.display = 'none';
            editProfileUploadedImage.style.display = 'block';
            const userId = auth.currentUser.uid;
            const userRef = ref(db, `users/${userId}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    userData.imageUrl = imageUrl;
                    set(userRef, userData)
                        .then(() => console.log("User image updated successfully."))
                        .catch((error) => console.error("Error updating user image:", error));
                }
            });
        };
        reader.readAsDataURL(file);
    });

    function isValidImageFile(file) {
        const acceptedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
        return acceptedTypes.includes(file.type);
    }

    function isValidImageSize(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        return file.size <= maxSize;
    }

    editPublicNameBtn.addEventListener('click', () => {
        makeEditable(publicName);
    });

    editBioBtn.addEventListener('click', () => {
        makeEditable(bio);
    });

    saveChangesBtn.addEventListener('click', () => {
        const updatedPublicName = publicName.value.trim();
        const updatedBio = bio.value.trim();

        if (!updatedPublicName) {
            alert("Please enter a public name.");
            return;
        }
        if (updatedPublicName.length > 50) {
            alert("Public name should not exceed 50 characters.");
            return;
        }

        if (updatedBio.length > 500) {
            alert("Bio should not exceed 500 characters.");
            return;
        }

        const userId = auth.currentUser.uid;
        const userRef = ref(db, `users/${userId}`);

        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                userData.username = updatedPublicName;
                userData.publicName = updatedPublicName;
                userData.bio = updatedBio;

                set(userRef, userData)
                    .then(() => {
                        console.log("User data updated successfully.");
                    })
                    .catch((error) => {
                        console.error("Error updating user data:", error);
                    });
            }
        });
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            const userId = user.uid;
            const usersRef = ref(db, 'users/' + userId);

            onValue(usersRef, (snapshot) => {
                const userData = snapshot.val();
                displayUserInfo(userData);
            });
        } else {
            console.log('No user signed in.');
        }
    });

    function makeEditable(element) {
        element.readOnly = false;
        element.focus();
    }
});



function showContent(contentId) {
    const allContents = document.querySelectorAll('.content');
    allContents.forEach(content => {
        content.style.display = 'none';
    });

    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
}

document.getElementById('publicProfileBtn').addEventListener('click', function () {
    showContent('publicProfile');
});

document.getElementById('managepasswordBtn').addEventListener('click', function () {
    showContent('managepassword');
});

document.getElementById('manageBookmarksBtn').addEventListener('click', function () {
    showContent('manageBookmarks');
});

function getUserDataFromDatabase() {
    const user = auth.currentUser;
    if (!user) {
        // Handle the case where there is no authenticated user
        console.error("No authenticated user found.");
        return Promise.reject("No authenticated user found.");
    }
    
    const userId = user.uid;
    const usersRef = ref(db, 'users/' + userId);

    return get(usersRef).then(snapshot => {
        return snapshot.val();
    }).catch(error => {
        console.error("Error fetching user data:", error);
        return Promise.reject(error);
    });
}


function displayUserData(userData) {
    const currentPasswordElement = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newpassword");
    const confirmPasswordInput = document.getElementById("confirmpassword");

    currentPasswordElement.textContent = userData.password;

    document.getElementById("savePassword").addEventListener("click", function () {
        const currentPassword = currentPasswordElement.textContent.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!currentPassword) {
            alert("Please enter your current password.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            alert("Please enter both new and confirm passwords.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match.");
            return;
        }

        if (!/(?=.*[a-z])/.test(newPassword)) {
            alert("Password must contain at least 1 lowercase letter");
            return;
        }

        if (!/(?=.*[A-Z])/.test(newPassword)) {
            alert("Password must contain at least 1 uppercase letter");
            return;
        }

        if (!/(?=.*\d)/.test(newPassword)) {
            alert("Password must contain at least 1 number");
            return;
        }

        if (!/(?=.*[!@#$%^&*()])/.test(newPassword)) {
            alert("Password must contain at least 1 symbol");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        const userId = auth.currentUser.uid;
        const userRef = ref(db, 'users/' + userId);
        onValue(userRef, (snapshot) => {
            const existingUserData = snapshot.val();
            if (existingUserData) {
                // Check if the current password matches the one in the database
                if (currentPassword !== existingUserData.password) {
                    alert("Current password is incorrect.");
                    return;
                }

                const updatedUserData = {
                    ...existingUserData,
                    password: newPassword
                };

                set(userRef, updatedUserData)
                    .then(() => {
                        alert("Password and user data updated successfully.");
                    })
                    .catch(error => {
                        alert("Error updating password and user data: " + error.message);
                    });

                newPasswordInput.value = "";
                confirmPasswordInput.value = "";
            } else {
                console.error("User data not found.");
            }
        });
    });
}


function fetchUserData() {
    const userId = auth.currentUser.uid;
    const userRef = ref(db, 'users/' + userId);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            displayUserData(userData);
        } else {
            console.error("User data not found.");
        }
    });
}

onAuthStateChanged(auth, user => {
    if (user) {
        fetchUserData();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    getUserDataFromDatabase().then(userData => {
        displayUserData(userData);
    }).catch(error => {
        console.error("Error fetching user data:", error);
    });
});



document.addEventListener('DOMContentLoaded', async () => {
    const bookmarksContainer = document.getElementById('bookmarks-container');

    try {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.log("User not logged in.");
                return;
            }

            const userId = user.uid;

            const userBooksRef = ref(db, `users/${userId}/books`);
            const snapshot = await get(userBooksRef);
            const bookmarkedBooks = snapshot.val();

            if (!bookmarkedBooks) {
                console.log("No bookmarked books found.");
                return;
            }

            for (let bookId in bookmarkedBooks) {
                const book = bookmarkedBooks[bookId];
                const bookmark = createBookmark(book, bookId, userId);
                bookmarksContainer.appendChild(bookmark);
            }
        });
    } catch (error) {
        console.error("Error fetching bookmarked books:", error);
    }
});

function createBookmark(book, bookId, userId) {
    const bookmark = document.createElement('div');
    bookmark.classList.add('bookmark');

    const anchor = document.createElement('a');
    anchor.href = `/html/previewpage.html?bookId=${encodeURIComponent(bookId)}&userId=${userId}`;

    const img = document.createElement('img');
    img.src = book.imageUrl;
    img.alt = book.title;

    const title = document.createElement('h2');
    title.textContent = book.title;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
        try {
            const userBookRef = ref(db, `users/${userId}/books/${bookId}`);
            await set(userBookRef, null);

            bookmark.remove();
        } catch (error) {
            console.error("Error deleting bookmark:", error);
        }
    });

    anchor.appendChild(img);
    anchor.appendChild(title);
    bookmark.appendChild(anchor);
    bookmark.appendChild(deleteButton);

    return bookmark;
}
