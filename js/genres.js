import { db } from "./firebaseConfig.mjs";
import { ref, get, onValue } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';

let genreMenuContainer = document.getElementById("genreMenuContainer");

// Function to fetch and display books
function displayBooks() {
    const bookContainer = document.getElementById('bookContainer');
    const booksRef = ref(db, 'books/');
    onValue(booksRef, (snapshot) => {
        bookContainer.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const bookData = childSnapshot.val();
            const bookId = childSnapshot.key;
            const bookElement = createBookElement(bookData, bookId);
            bookContainer.appendChild(bookElement);
        });
    });
}

function searchBooksByGenre() {
    const selectedGenres = [];
    const genreCheckboxes = document.querySelectorAll('.genre-item input[type="checkbox"]');
    genreCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            selectedGenres.push(checkbox.id.replace('Genre', ''));
        }
    });
    filterBooks(selectedGenres);
}

function filterBooks(genres) {
    let bookContainer = document.getElementById('bookContainer');
    bookContainer.innerHTML = '';
    let booksRefPromises = genres.map(genre => {
        if (genre === 'all') {
            return get(ref(db, 'books/'));
        } else {
            return get(ref(db, `genres/${genre}/books`));
        }
    });
    Promise.all(booksRefPromises)
        .then(snapshots => {
            let books = {};
            snapshots.forEach(snapshot => {
                snapshot.forEach(childSnapshot => {
                    let bookData = childSnapshot.val();
                    let bookId = childSnapshot.key;
                    books[bookId] = bookData;
                });
            });
            Object.keys(books).forEach(bookId => {
                let bookData = books[bookId];
                let bookElement = createBookElement(bookData, bookId);
                bookContainer.appendChild(bookElement);
            });
        })
        .catch(error => {
            console.error('Error filtering books by genre:', error);
        });
}

document.querySelectorAll('.genre-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', searchBooksByGenre);
});

// Function to create a book element
function createBookElement(bookData, bookId) {
    const containerCard = document.createElement('div');
    containerCard.classList.add('container-card');

    const bookElement = document.createElement('div');
    bookElement.classList.add('book');

    const coverImg = document.createElement('img');
    coverImg.src = bookData.imageUrl;
    coverImg.alt = 'Cover';
    coverImg.classList.add('cover-img');
    coverImg.onclick = function () {
        window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(bookId)}`;
    };
    bookElement.appendChild(coverImg);

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = bookData.title;
    title.onclick = function () {
        window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(bookId)}`;
    };
    infoContainer.appendChild(title);

    const description = document.createElement('div');
    description.classList.add('description');
    description.textContent = bookData.description;
    infoContainer.appendChild(description);

    const borderLine = document.createElement('div');
    borderLine.classList.add('border-line');
    infoContainer.appendChild(borderLine);

    bookElement.appendChild(infoContainer);

    const genreTagsContainer = document.createElement('div');
    genreTagsContainer.classList.add('genre-tags-container');

    const genres = document.createElement('div');
    genres.classList.add('genres');
    genres.textContent = 'Genres: ' + bookData.genres.join(', ');
    genreTagsContainer.appendChild(genres);

    const tags = document.createElement('div');
    tags.classList.add('tags');
    tags.textContent = 'Tags: ' + bookData.tags.join(', ');
    genreTagsContainer.appendChild(tags);
    bookElement.appendChild(genreTagsContainer);

    containerCard.appendChild(bookElement);
    return containerCard;
}

// Function to search books by title
function searchBooks() {
    const searchInput = document.getElementById("search").value.trim().toLowerCase();
    console.log("Search Input:", searchInput); 
    const bookContainer = document.getElementById("bookContainer");

    // Empty the previous search results
    bookContainer.innerHTML = "";

    const booksRef = ref(db, "books/");
    get(booksRef)
        .then((snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const bookData = childSnapshot.val();
                const bookId = childSnapshot.key;

                console.log("Book Title:", bookData.title); 
                if (bookData.title.toLowerCase().includes(searchInput)) {
                    const bookElement = createBookElement(bookData, bookId);
                    bookContainer.appendChild(bookElement);
                    console.log("Book added to container:", bookData.title);
                }
            });
        })
        .catch((error) => {
            console.error("Error searching books:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {

    const searchButton = document.getElementById("searchButton");
    searchButton.addEventListener("click", searchBooks);

    const searchInput = document.getElementById("search");
    searchInput.addEventListener("input", () => {
        const bookContainer = document.getElementById("bookContainer");
    });
});



document.addEventListener('DOMContentLoaded', () => {
    filterBooks(['all']);
});
