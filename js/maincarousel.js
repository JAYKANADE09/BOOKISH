import { db, auth } from "./firebaseConfig.mjs";
import {
  query,
  ref,
  get,
  limitToLast,
  orderByKey,
  set,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

let slideIndex = 0;
let timer;

// Fetch book details from Firebase Realtime Database
async function fetchBooks(userId) {
  const slideshowContainer = document.getElementById("slideshow-container");
  try {
    const snapshot = await get(ref(db, "books"));
    const books = snapshot.val();

    if (books) {
      const bookDetails = Object.entries(books).map(([bookId, book]) => ({
        id: bookId,
        ...book,
      }));

      const shuffledBooks = getRandomItems(bookDetails, 6);

      shuffledBooks.forEach((book) => {
        const slide = createSlide(book, book.id, userId); 
        slideshowContainer.appendChild(slide);
      });
    } else {
      console.log("No books found.");
    }

    showSlides();

    setTimeout(fetchBooks, 600000, userId); 
  } catch (error) {
    console.error("Error fetching books: ", error);
  }
}

function getRandomItems(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function createSlide(book, bookId, userId) {
  const slide = document.createElement("div");
  slide.classList.add("mySlides");

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("content");

  const genresHeading = document.createElement("h3");
  genresHeading.textContent = "Genres: ";
  const genresSpan = document.createElement("span");
  genresSpan.textContent = book.genres;
  genresHeading.appendChild(genresSpan);

  const titleHeading = document.createElement("h2");
  titleHeading.textContent = book.title;
  titleHeading.onclick = function () {
    window.location.href = `/html/previewpage.html?bookId=${encodeURIComponent(bookId)}&userId=${userId}`;
  };


  const descriptionPara = document.createElement("p");
  descriptionPara.textContent = book.description;

  contentDiv.appendChild(genresHeading);
  contentDiv.appendChild(titleHeading);
  contentDiv.appendChild(descriptionPara);

  const imgContainerDiv = document.createElement("div");
  imgContainerDiv.classList.add("img-container");

  const img = document.createElement("img");
  img.classList.add("img");
  img.src = book.imageUrl;
  img.alt = book.title;

  imgContainerDiv.appendChild(img);

  const btnSlidesDiv = document.createElement("div");
  btnSlidesDiv.classList.add("btn-slides");

  const readNowLink = document.createElement("a");
  readNowLink.classList.add("read-now");
  readNowLink.textContent = "Read now";
  readNowLink.addEventListener("click", () => {
    window.location.href = `/html/displaychapters.html?bookId=${bookId}`;
  });
  const bookmarkLink = document.createElement("a");
  bookmarkLink.classList.add("carousel-bkmrk");

  const bookmarkIcon = document.createElement("i");
  bookmarkIcon.classList.add("bx", "bxs-bookmark");
  bookmarkIcon.addEventListener("click", () => {
    bookmarkBook(bookId);
  });

  bookmarkLink.appendChild(bookmarkIcon);
  btnSlidesDiv.appendChild(readNowLink);
  btnSlidesDiv.appendChild(bookmarkLink);

  slide.appendChild(contentDiv);
  slide.appendChild(imgContainerDiv);
  slide.appendChild(btnSlidesDiv);

  return slide;
}

// Show slides function
function showSlides() {
  const slides = document.getElementsByClassName("mySlides");
  const dotsContainer = document.querySelector(".slider-dots");

  dotsContainer.innerHTML = "";
  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    dot.setAttribute("onclick", `currentSlide(${i + 1})`);
    dotsContainer.appendChild(dot);
  }

  const dots = document.getElementsByClassName("dot");

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
    dots[i].classList.remove("active");
  }

  slideIndex++;

  if (slideIndex > slides.length) {
    slideIndex = 1;
  }

  slides[slideIndex - 1].style.display = "flex";
  dots[slideIndex - 1].classList.add("active");

  clearTimeout(timer);
  timer = setTimeout(() => {
    showSlides();
  }, 3000);
}

function currentSlide(index) {
  slideIndex = index;
  showSlides();
}

document.addEventListener('DOMContentLoaded', async () => {
  const userData = sessionStorage.getItem('user');
  let userId = null;
  if (userData) {
    const user = JSON.parse(userData);
    userId = user.uid;
  }

  await fetchBooks(userId); 
});


async function showGenre(genre) {
  try {
    let genrePath = 'books'; 
    if (genre !== 'all') {
      genrePath = `genres/${genre}/books`;
    }

    const booksRef = ref(db, genrePath);
    const q = query(booksRef, limitToLast(20), orderByKey());

    const snapshot = await get(q);
    const books = snapshot.val();

    console.log(`Fetched recently added ${genre} books:`, books);

    renderBooks(books);
  } catch (error) {
    console.error(`Error fetching recently added ${genre} books:`, error);
  }
}

function renderBooks(books, userId) {
  const container = document.getElementById('books-container');
  container.innerHTML = ''; 

  for (let bookId in books) {
    const book = books[bookId];
    const bookElement = document.createElement('div');
    bookElement.classList.add('book');

    const previewLink = document.createElement('a');
    previewLink.href = `/html/previewpage.html?bookId=${encodeURIComponent(bookId)}&userId=${userId}`;
    previewLink.classList.add('book-link');
    bookElement.appendChild(previewLink);

    const imageElement = document.createElement('img');
    imageElement.src = book.imageUrl;
    imageElement.alt = book.title;
    imageElement.classList.add('book-image');
    previewLink.appendChild(imageElement);

    const titleElement = document.createElement('h3');
    titleElement.textContent = book.title;
    titleElement.classList.add('book-title');
    previewLink.appendChild(titleElement);

    container.appendChild(bookElement);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await showGenre('all');

  const genreButtons = document.querySelectorAll('.pagination a');
  genreButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const genre = button.id.split('-')[1];
      await showGenre(genre);
    });
  });
});


async function bookmarkBook(bookId) {
  const user = auth.currentUser;
  if (!user) {
    console.log("User not logged in.");
    return;
  }
  const userId = user.uid;

  try {
    const bookRef = ref(db, `books/${bookId}`);
    const bookSnapshot = await get(bookRef);
    const bookData = bookSnapshot.val();

    if (!bookData) {
      console.log("Book details not found.");
      return;
    }

    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val();

    if (!userData) {
      console.log("User details not found.");
      return;
    }

    const userBooksRef = ref(db, `users/${userId}/books/${bookId}`);
    await set(userBooksRef, { ...bookData, userDetails: userData });

    const isSubscribed = userData.subscribed === true;

    if (isSubscribed) {
      const subscribedBooksRef = ref(db, `subscribedusers/${userId}/books/${bookId}`);
      await set(subscribedBooksRef, { ...bookData, userDetails: userData });
    }

    alert("Book bookmarked successfully!");
  } catch (error) {
    console.error("Error bookmarking book:", error);
    alert("An error occurred while bookmarking the book. Please try again.");
  }
}
