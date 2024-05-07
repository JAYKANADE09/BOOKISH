import { db, auth } from "./firebaseConfig.mjs";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const tagsRef = ref(db, 'tags');

// Function to fetch tag names and display them
async function displayTagNames() {
    const tagList = document.getElementById('tagList');

    try {
        const snapshot = await get(tagsRef);
        const tags = snapshot.val();

        if (tags) {
            const list = document.createElement('ul');
            list.style.columns = '5';

            Object.keys(tags).forEach((tag) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `displaytagbook.html?tag=${tag}`;
                link.textContent = tag;
                listItem.appendChild(link);
                list.appendChild(listItem);
            });

            tagList.appendChild(list);
        } else {
            tagList.innerHTML = '<p>No tags found.</p>';
        }
    } catch (error) {
        console.error("Error fetching tag names:", error);
        tagList.innerHTML = '<p>Error fetching tag names. Please try again.</p>';
    }
}

window.addEventListener('load', displayTagNames);
