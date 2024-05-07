import { db } from "./firebaseConfig.mjs";
import { ref, update, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js';


let genreMenuContainer = document.getElementById("genreMenuContainer");
document.querySelectorAll('.genre-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', searchBooksByGenre);
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', handleDropdownSelection);
});
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


function toggleDropdown() {
    genreMenuContainer.classList.toggle("show");
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
        window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(
            bookId
        )}`;
    };
    bookElement.appendChild(coverImg);

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = bookData.title;
    title.onclick = function () {
        window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(
            bookId
        )}`;
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

    const trashIcon = document.createElement('i');
    trashIcon.classList.add('fas', 'fa-trash', 'delete-icon');
    trashIcon.setAttribute('title', 'Delete');
    trashIcon.addEventListener('click', () => {
        deleteBook(bookId);
    });

    const genreTagsContainer = document.createElement('div');
    genreTagsContainer.appendChild(trashIcon);
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

// Calling the filterBooks function when the page loads to display all books initially
document.addEventListener('DOMContentLoaded', () => {
    filterBooks(['all']);
});

// Function to search books by title
function searchBooks() {
    const searchInput = document.getElementById("search").value.trim().toLowerCase();
    console.log("Search Input:", searchInput); // Log the search input value
    const bookContainer = document.getElementById("bookContainer");

    // Empty the previous search results
    bookContainer.innerHTML = "";

    const booksRef = ref(db, "books/");
    get(booksRef)
        .then((snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const bookData = childSnapshot.val();
                const bookId = childSnapshot.key;

                console.log("Book Title:", bookData.title); // Log the title of each book
                if (bookData.title.toLowerCase().includes(searchInput)) {
                    const bookElement = createBookElement(bookData, bookId);
                    bookContainer.appendChild(bookElement);
                    console.log("Book added to container:", bookData.title); // Log when a book is added to the container
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


async function deleteBook(bookId) {
    const bookRef = ref(db, `books/${bookId}`);

    try {
        const bookSnapshot = await get(bookRef);
        const bookData = bookSnapshot.val();
        const bookName = bookData.title;

        const confirmation = confirm(`Are you sure you want to delete the book "${bookName}"?`);

        if (confirmation) {
            await remove(bookRef);
            console.log(`Book "${bookName}" deleted successfully from "books" node`);

            const genres = bookData.genres || [];
            for (const genre of genres) {
                const genreRef = ref(db, `genres/${genre}/books/${bookId}`);
                await remove(genreRef);
                console.log(`Book "${bookName}" deleted successfully from "${genre}" genre node`);
            }

            fetchCountsAndUpdateUI();

            alert(`Book "${bookName}" deleted successfully.`);
        } else {
            console.log('Deletion cancelled by admin');
        }
    } catch (error) {
        console.error('Error deleting book:', error.message);
        alert('Error deleting book. Please try again later.');
    }
}

// Function to fetch users from Firebase Realtime Database
var tableBody = document.getElementById('tableBody');

function fetchUsers() {
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        let serialNumber = 1;
        snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();
            const username = userData.username;
            const email = userData.email;
            const row = document.createElement('tr');
            const cellSerialNumber = document.createElement('td');
            cellSerialNumber.textContent = serialNumber++;
            const cellUsername = document.createElement('td');
            cellUsername.textContent = username;
            const cellEmail = document.createElement('td');
            cellEmail.textContent = email;
            const cellActions = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', function () {
                editUser(userSnapshot.key);
            });
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', function () {
                deleteUser(userSnapshot.key);
            });
            const space = document.createElement('span');
            space.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
            cellActions.appendChild(editButton);
            cellActions.appendChild(space); 
            cellActions.appendChild(deleteButton);
            row.appendChild(cellSerialNumber);
            row.appendChild(cellUsername);
            row.appendChild(cellEmail);
            row.appendChild(cellActions);
            tableBody.appendChild(row);
        });
    });
}
fetchUsers();

function searchUsers() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim().toLowerCase();

    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        let serialNumber = 1;

        snapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();
            const username = userData.username.toLowerCase();
            const email = userData.email.toLowerCase();

            if (username.includes(searchTerm) || email.includes(searchTerm)) {
                const row = document.createElement('tr');

                const cellSerialNumber = document.createElement('td');
                cellSerialNumber.textContent = serialNumber++;

                const cellUsername = document.createElement('td');
                cellUsername.textContent = userData.username;

                const cellEmail = document.createElement('td');
                cellEmail.textContent = userData.email;

                const cellActions = document.createElement('td');

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', function () {
                    editUser(userSnapshot.key);
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', function () {
                    deleteUser(userSnapshot.key);
                });

                const space = document.createElement('span');
                space.innerHTML = '&nbsp;&nbsp;';

                cellActions.appendChild(editButton);
                cellActions.appendChild(space);
                cellActions.appendChild(deleteButton);

                row.appendChild(cellSerialNumber);
                row.appendChild(cellUsername);
                row.appendChild(cellEmail);
                row.appendChild(cellActions);
                
                tableBody.appendChild(row);
            }
        });
    });
}

function editUser(userId) {
    const userRef = ref(db, `users/${userId}`);

    get(userRef)
        .then((snapshot) => {
            const userData = snapshot.val();

            const newUsername = prompt('Enter the new username:', userData.username);

            const updatedFields = {};

            if (newUsername !== null && newUsername !== '') {
                updatedFields.username = newUsername;
            } else {
                updatedFields.username = userData.username;
            }

            update(userRef, updatedFields);

            fetchUsers();
        })
        .catch((error) => {
            console.error('Error fetching user data:', error.message);
        });
}


function deleteUser(userId) {
    const userRef = ref(db, `users/${userId}`);

    get(userRef)
        .then((snapshot) => {
            const userData = snapshot.val();
            const username = userData.username;
            const email = userData.email;

            const confirmation = confirm(`Are you sure you want to delete the following user?\n\nUsername: ${username}\nEmail: ${email}`);

            if (confirmation) {
                remove(userRef)
                    .then(() => {
                        fetchUsers();
                        alert(`User deleted successfully!\n\nUsername: ${username}\nEmail: ${email}`);
                    })
                    .catch((error) => {
                        console.error('Error deleting user:', error.message);
                        alert('Error deleting user. Please try again later.');
                    });
            }
        })
        .catch((error) => {
            console.error('Error fetching user data:', error.message);
            alert('Error fetching user data. Please try again later.');
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchUsers);
    } else {
        console.error("Search input element not found");
    }
});

async function fetchSubscribedUsers() {
    while (subscriptionsTableBody.firstChild) {
        subscriptionsTableBody.removeChild(subscriptionsTableBody.firstChild);
    }
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let serialNumber = 1;
    snapshot.forEach(userSnapshot => {
        const userData = userSnapshot.val();
        if (userData.subscribeduser) {
            const subscribedUsersRef = ref(db, `users/${userSnapshot.key}/subscribedusers`);
            get(subscribedUsersRef).then(async subscribedUserSnapshot => {
                const subscribedUserDetails = subscribedUserSnapshot.val();
                if (subscribedUserDetails) {
                    const cardHolder = subscribedUserDetails.cardholder ? subscribedUserDetails.cardholder.toLowerCase() : '';
                    const email = subscribedUserDetails.email ? subscribedUserDetails.email.toLowerCase() : '';
                    const dataPrice = subscribedUserDetails.dataPrice ? subscribedUserDetails.dataPrice.toLowerCase() : '';
                    const country = subscribedUserDetails.country ? subscribedUserDetails.country.toLowerCase() : '';
                    const row = document.createElement('tr');
                    const cellSerialNumber = document.createElement('td');
                    cellSerialNumber.textContent = serialNumber++;
                    const cellCardHolder = document.createElement('td');
                    cellCardHolder.textContent = cardHolder;
                    const cellEmail = document.createElement('td');
                    cellEmail.textContent = email;
                    const cellSubscriptionAmount = document.createElement('td');
                    cellSubscriptionAmount.textContent = dataPrice ? `₹${dataPrice}/-` : '';
                    const cellCountry = document.createElement('td');
                    cellCountry.textContent = country;
                    row.appendChild(cellSerialNumber);
                    row.appendChild(cellCardHolder);
                    row.appendChild(cellEmail);
                    row.appendChild(cellSubscriptionAmount);
                    row.appendChild(cellCountry);
                    subscriptionsTableBody.appendChild(row);
                }
            }).catch(error => {
                console.error('Error fetching subscribed user details:', error.message);
            });
        }
    });
}
fetchSubscribedUsers();


// Function to fetch counts from Firebase and update the UI
async function fetchCountsAndUpdateUI() {
    const usersRef = ref(db, 'users/');
    const booksRef = ref(db, 'books/');
    const genresRef = ref(db, 'genres/');
    const usersSnapshot = await get(usersRef);
    const booksSnapshot = await get(booksRef);
    const genresSnapshot = await get(genresRef);
    let userCount = 0;
    let subscribedUserCount = 0;
    let bookCount = 0;
    let totalGenreCount = 0;
    if (usersSnapshot.exists()) {
        usersSnapshot.forEach(() => {
            userCount++;
        });
    }
    usersSnapshot.forEach(userSnapshot => {
        const userData = userSnapshot.val();
        if (userData.subscribeduser) {
            subscribedUserCount++;
        }
    });
    if (booksSnapshot.exists()) {
        booksSnapshot.forEach(() => {
            bookCount++;
        });
    }
    if (genresSnapshot.exists()) {
        genresSnapshot.forEach(() => {
            totalGenreCount++;
        });
    }
    let genreCounts = {
        'Action': 0,
        'Adventure': 0,
        'Fantasy': 0,
        'Game': 0,
        'Romance': 0,
        'Urban': 0
    };
    if (genresSnapshot.exists()) {
        genresSnapshot.forEach((genreSnapshot) => {
            const genre = genreSnapshot.key;
            const books = genreSnapshot.child('books');
            let count = 0;
            if (books.exists()) {
                books.forEach(() => {
                    count++;
                });
            }
            genreCounts[genre] = count;
        });
    }
    document.getElementById('userCount').innerText = userCount;
    document.getElementById('subscribedUserCount').innerText = subscribedUserCount;
    document.getElementById('bookCount').innerText = bookCount;
    document.getElementById('totalGenreCount').innerText = totalGenreCount;
    Object.keys(genreCounts).forEach((genre) => {
        document.getElementById(genre.toLowerCase() + 'Count').innerText = genreCounts[genre];
    });
}
fetchCountsAndUpdateUI();

function searchSubscribedUsers() {
    const searchTerm = document.getElementById('searching').value.trim().toLowerCase();
    const rows = subscriptionsTableBody.getElementsByTagName('tr');

    let serialNumber = 1;
    let visibleRowCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cardHolder = row.cells[1].textContent.trim().toLowerCase();
        const email = row.cells[2].textContent.trim().toLowerCase();

        if (cardHolder.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
            row.cells[0].textContent = serialNumber++;
            visibleRowCount++;
        } else {
            row.style.display = 'none';
        }
    }

    document.getElementById('subscribedUserCount').innerText = visibleRowCount;
}

document.getElementById('searching').addEventListener('input', searchSubscribedUsers);

