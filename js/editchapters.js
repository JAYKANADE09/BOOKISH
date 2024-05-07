import { db } from "./firebaseConfig.mjs";
import {
    ref,
    get,
    set,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

function getBookIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("bookId");
}

function getChapterIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("chapterId");
}

// Function to fetch editchapter details and populate the form fields
async function displayChapterDetails(bookId, chapterId) {
    try {
        const chapterRef = ref(db, `books/${bookId}/chapters/${chapterId}`);
        const snapshot = await get(chapterRef);
        const chapterData = snapshot.val();
        if (chapterData) {
            const chapterTitleInput = document.getElementById("chapterTitle");
            const chapterContentInput = document.getElementById("chapterContent");
            chapterTitleInput.value = chapterData.title;
            chapterContentInput.value = chapterData.content;
            chapterTitleInput.readOnly = true;
            chapterContentInput.readOnly = true;
            const editIconTitle = document.createElement('i');
            editIconTitle.classList.add('bx', 'bxs-edit', 'edit-icon');
            editIconTitle.setAttribute('title', 'Edit Title');
            editIconTitle.addEventListener('click', () => {
                toggleReadOnly(chapterTitleInput);
            });
            chapterTitleInput.parentNode.appendChild(editIconTitle);
            const editIconContent = document.createElement('i');
            editIconContent.classList.add('bx', 'bxs-edit', 'edit-icon');
            editIconContent.setAttribute('title', 'Edit Content');
            editIconContent.addEventListener('click', () => {
                toggleReadOnly(chapterContentInput);
            });
            chapterContentInput.parentNode.appendChild(editIconContent);
        } else {
            console.log("Chapter not found in the database.");
            alert("Chapter not found in the database.");
        }
    } catch (error) {
        console.error("Error fetching chapter details:", error);
        alert("An error occurred while fetching chapter details. Please try again.");
    }
}

function toggleReadOnly(inputField) {
    inputField.readOnly = !inputField.readOnly;
}

window.onload = function () {
    const bookId = getBookIdFromURL();
    const chapterId = getChapterIdFromURL();

    if (bookId && chapterId) {
        displayChapterDetails(bookId, chapterId);
    } else {
        console.error("No book ID or chapter ID found in URL parameters.");
        alert("No book ID or chapter ID found in URL parameters.");
    }
};

document.getElementById("addChapterBtn").addEventListener("click", async function (event) {
    event.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
        return; // Exit if form is not valid
    }

    const bookId = getBookIdFromURL();
    const chapterId = getChapterIdFromURL();

    if (!bookId || !chapterId) {
        console.error("No book ID or chapter ID found in URL parameters.");
        alert("No book ID or chapter ID found in URL parameters.");
        return;
    }

    const chapterTitleInput = document.getElementById("chapterTitle");
    const chapterContentInput = document.getElementById("chapterContent");

    const updatedTitle = chapterTitleInput.value.trim();
    const updatedContent = chapterContentInput.value.trim();

    try {
        const chapterRef = ref(db, `books/${bookId}/chapters/${chapterId}`);
        await set(chapterRef, {
            title: updatedTitle,
            content: updatedContent
        });

        alert("Chapter updated successfully!");
    } catch (error) {
        console.error("Error updating chapter details:", error);
        alert("An error occurred while updating chapter details. Please try again.");
    }
});

// Function to validate the form fields
function validateForm() {
    const chapterTitle = document.getElementById("chapterTitle").value;
    const chapterContent = document.getElementById("chapterContent").value;

    // Required fields validation
    if (!chapterTitle.trim() || !chapterContent.trim()) {
        alert("Please fill in all required fields.");
        return false;
    }

    // Chapter content non-empty validation
    if (!chapterTitle.trim()) {
        alert("Please enter chapter title.");
        return false;
    }

    // Title length validation (optional)
    if (chapterTitle.length < 20) {
        alert("Chapter title should exceed 20 characters.");
        return false;
    }

    // Title length validation (optional)
    if (chapterTitle.length > 100) {
        alert("Chapter title should not exceed 100 characters.");
        return false;
    }



    // Content length validation (optional)
    if (chapterContent.length > 50000) {
        alert("Chapter content should not exceed 50000 characters.");
        return false;
    }


    // Chapter content non-empty validation
    if (!chapterContent.trim()) {
        alert("Please enter chapter content.");
        return false;
    }

    return true; 
}
