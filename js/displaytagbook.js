import { db, auth } from "./firebaseConfig.mjs";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

function getTagNameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tag');
}

// Function to fetch book details by tag name and book ID
async function displayBooksByTag(tagName) {
    const tag = document.getElementById('tagname');
    const tagNameHeading = document.createElement('h1');
    tagNameHeading.classList.add('tagName-heading');
    tagNameHeading.innerHTML = `#${tagName}`;
    tag.appendChild(tagNameHeading);

    const bookList = document.getElementById('bookList');

    try {
        const tagRef = ref(db, `tags/${tagName}/books`);
        const snapshot = await get(tagRef);
        const books = snapshot.val();

        if (books) {
            bookList.innerHTML = '';

            Object.keys(books).forEach(bookId => {
                const bookDetails = books[bookId];

                const bookContainer = document.createElement('div');
                bookContainer.classList.add('book-container');

                const displaybookContainer = document.createElement('div');
                displaybookContainer.classList.add('displaybookcontainer');

                const book = document.createElement('div');
                book.classList.add('book');

                const imageContainer = document.createElement('div');
                imageContainer.classList.add('book-image-container');
                const image = document.createElement('img');
                image.src = bookDetails.imageUrl;
                image.alt = 'Book Cover';
                image.onclick = function () {
                    window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(
                        bookId
                    )}`;
                };
                imageContainer.appendChild(image);

                const detailsContainer = document.createElement('div');
                detailsContainer.classList.add('book-details-container');

                const title = document.createElement('h2');
                title.classList.add('book-title');
                title.textContent = bookDetails.title;
                title.onclick = function () {
                    window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(
                        bookId
                    )}`;
                };

                const author = document.createElement('p');
                author.classList.add('book-author');
                author.innerHTML = `<strong>Author:</strong> ${bookDetails.username}`;

                detailsContainer.appendChild(title);
                detailsContainer.appendChild(author);

                book.appendChild(imageContainer);
                book.appendChild(detailsContainer);

                displaybookContainer.appendChild(book);
                bookContainer.appendChild(displaybookContainer);
                bookList.appendChild(bookContainer);
            });
        } else {
            bookList.innerHTML = '<p>No books found with this tag.</p>';
        }
    } catch (error) {
        console.error("Error fetching books by tag:", error);
        bookList.innerHTML = '<p>Error fetching books. Please try again.</p>';
    }
}

window.addEventListener('load', () => {
    const tagName = getTagNameFromURL();
    if (tagName) {
        displayBooksByTag(tagName);
    } else {
        console.error('Tag name not found in URL parameter.');
    }
});
