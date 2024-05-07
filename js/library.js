import { db, auth } from "./firebaseConfig.mjs";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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

  anchor.appendChild(img);
  anchor.appendChild(title);
  bookmark.appendChild(anchor);

  return bookmark;
}
