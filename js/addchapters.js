import { auth, db } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  push,
  ref,
  set,
  get,
  remove,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Function to extract the book ID from the URL parameter
function getBookIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("bookId");
}

// Function to handle add chapter form submission
async function submitForm(event, bookId) {
  event.preventDefault();

  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email;
        const chapterTitle = document.getElementById("chapterTitle").value;
        const chapterContent = document.getElementById("chapterContent").value;

        // Validate chapter title
        if (!chapterTitle) {
          alert("Please enter a chapter title.");
          return;
        }

        // Validate chapter content
        if (!chapterContent) {
          alert("Please enter chapter content.");
          return;
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
        
        const chapterRef = push(ref(db, `books/${bookId}/chapters`), {
          username: email,
          email: email,
          title: chapterTitle,
          content: chapterContent,
          timestamp: new Date().toLocaleString(),
        });
        console.log(chapterRef);
        await set(ref(db, `books/${bookId}/chapters/${chapterRef.key}`), {
          username: email,
          email: email,
          title: chapterTitle,
          content: chapterContent,
          timestamp: new Date().toLocaleString(),
        });
        document.getElementById("chapterTitle").value = "";
        document.getElementById("chapterContent").value = "";
        alert("Chapter added successfully!");
        window.location.href = `/html/addchapter.html?bookId=${encodeURIComponent(bookId)}`;
      }
    });
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    alert("An unexpected error occurred. Please try again.");
  }
}

document
  .getElementById("addChapterBtn")
  .addEventListener("click", function (event) {
    const bookId = getBookIdFromURL();
    if (bookId) {
      submitForm(event, bookId);
    } else {
      console.error("No book ID found in URL parameter.");
      alert("No book ID found in URL parameter.");
    }
  });


// Function to display chapters
async function displayChapters(bookId) {
  try {
    const chaptersRef = ref(db, `books/${bookId}/chapters`);
    const snapshot = await get(chaptersRef);
    const chapters = snapshot.val();

    if (chapters) {
      const chaptersContainer = document.getElementById("chaptersContainer");
      chaptersContainer.innerHTML = "";

      let index = 1;

      for (const chapterId in chapters) {
        const chapter = chapters[chapterId];
        const chapterBox = document.createElement("div");
        chapterBox.classList.add("chapter-box");

        const editIcon = document.createElement('i');
        editIcon.classList.add('fas', 'fa-edit', 'edit-icon');
        editIcon.setAttribute('title', 'Edit');
        editIcon.addEventListener('click', () => {
          window.location.href = `/html/editchapters.html?bookId=${bookId}&chapterId=${chapterId}`;
        });

        const trashIcon = document.createElement('i');
        trashIcon.classList.add('fas', 'fa-trash-alt', 'delete-icon');
        trashIcon.setAttribute('title', 'Delete');
        trashIcon.addEventListener('click', () => {
          deleteChapter(bookId, chapterId, chapter.title, displayChapters);
        });

        const chapterTitle = document.createElement("a");
        chapterTitle.classList.add("chapter-title");
        chapterTitle.textContent = `${index}. ${chapter.title}`; // Display index with chapter title
        chapterTitle.href = `/html/displaychapters.html?bookId=${bookId}&chapterId=${chapterId}`;

        chapterBox.appendChild(editIcon);
        chapterBox.appendChild(trashIcon);
        chapterBox.appendChild(chapterTitle);

        chaptersContainer.appendChild(chapterBox);

        index++;
      }
    } else {
      console.log("No chapters found for this book.");
    }
  } catch (error) {
    console.error("Error fetching chapters:", error);
    alert("An error occurred while fetching chapters. Please try again.");
  }
}

// Calling displayChapters function when the page loads
window.onload = function () {
  const bookId = getBookIdFromURL();
  if (bookId) {
    displayChapters(bookId);
  } else {
    console.error("No book ID found in URL parameter.");
    alert("No book ID found in URL parameter.");
  }
};

// Function to delete a chapter
async function deleteChapter(bookId, chapterId, chapterTitle, displayChapters) {
  if (confirm(`Are you sure you want to delete the chapter "${chapterTitle}"?`)) {
    try {
      await remove(ref(db, `books/${bookId}/chapters/${chapterId}`));
      alert(`Chapter "${chapterTitle}" deleted successfully.`);
      displayChapters();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("An error occurred while deleting the chapter. Please try again.");
    }
  }
}
