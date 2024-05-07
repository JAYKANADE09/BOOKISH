import { auth, db } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  ref,
  get,
  onValue,
  set,
  push,
  remove
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

function displayBookDetails(bookId) {
  const bookDetailsContainer = document.getElementById("bookDetailsContainer");

  const bookRef = ref(db, `books/${bookId}`);

  onValue(bookRef, (snapshot) => {
    const bookData = snapshot.val();

    const mainbookContainer = document.createElement("div");
    mainbookContainer.classList.add("mainbook-container");

    const coverImg = document.createElement("img");
    coverImg.alt = "Cover";
    coverImg.classList.add("cover-img");
    coverImg.src = bookData.imageUrl;

    const titleContainer = document.createElement("div");
    titleContainer.classList.add("title-container");

    const title = document.createElement("div");
    title.classList.add("title");
    title.textContent = bookData.title;

    const genresContainer = document.createElement("div");
    genresContainer.classList.add("genres-container");
    const genretitle = document.createElement("h2")
    genretitle.textContent = "Genres:"
    genresContainer.appendChild(genretitle);
    for (const genre of bookData.genres) {
      const genreLink = document.createElement("a");
      genreLink.href = `genres.html?genre=${genre}`;
      genreLink.textContent = genre;
      genreLink.addEventListener("click", () => {
        filterBooks(genre);
      });
      genresContainer.appendChild(genreLink);
    }

    const tagsContainer = document.createElement("div");
    tagsContainer.classList.add("tags-container");
    const tagtitle = document.createElement("h2")
    tagtitle.textContent = "Tags:"
    tagsContainer.appendChild(tagtitle);
    for (const tag of bookData.tags) {
      const tagLink = document.createElement("a");
      tagLink.href = `displaytagbook.html?tag=${tag}`;
      tagLink.textContent = tag;
      tagLink.addEventListener("click", () => {
      });
      tagsContainer.appendChild(tagLink);
    }

    const authorname = document.createElement("div");
    authorname.classList.add("authorname");
    authorname.innerHTML = `<strong>Author:</strong> ${bookData.username}`;
    
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(genresContainer);
    titleContainer.appendChild(tagsContainer);
    titleContainer.appendChild(authorname)

    mainbookContainer.appendChild(coverImg);
    mainbookContainer.appendChild(titleContainer);

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    const readNowButton = document.createElement("button");
    readNowButton.textContent = "Read Now";
    readNowButton.addEventListener("click", async () => {
      try {
        const chaptersRef = ref(db, `books/${bookId}/chapters`);
        const snapshot = await get(chaptersRef);
        const chaptersData = snapshot.val();
        const firstChapterId = Object.keys(chaptersData)[0];
        window.location.href = `displaychapters.html?bookId=${bookId}&chapterId=${firstChapterId}`;
      } catch (error) {
        console.error("Error getting chapters data:", error);
        alert("An error occurred while getting chapters data. Please try again.");
      }
    });


    const bookmarkButton = document.createElement("button");
    bookmarkButton.innerHTML = '<i class="bx bxs-bookmark"></i>';
    bookmarkButton.addEventListener("click", () => {
      bookmarkBook(bookId);
    });

    buttonContainer.appendChild(readNowButton);
    buttonContainer.appendChild(bookmarkButton);

    const descriptTextContainer = document.createElement("button");
    descriptTextContainer.classList.add("descript-text-container");
    descriptTextContainer.textContent = "Synopsis";

    const chapterTextContainer = document.createElement("button");
    chapterTextContainer.classList.add("chapters-text-container");
    chapterTextContainer.textContent = "Chapters";

    const descriptContainer = document.createElement("div");
    descriptContainer.classList.add("descript-container");

    const description = document.createElement("div");
    description.classList.add("description");
    description.textContent = bookData.description;

    descriptContainer.appendChild(description);

    bookDetailsContainer.innerHTML = "";
    bookDetailsContainer.appendChild(mainbookContainer);
    bookDetailsContainer.appendChild(buttonContainer);
    bookDetailsContainer.appendChild(descriptTextContainer);
    bookDetailsContainer.appendChild(chapterTextContainer);
    bookDetailsContainer.appendChild(descriptContainer);

    const chaptersContainer = document.createElement("div");
    chaptersContainer.id = "chaptersContainer";
    chaptersContainer.style.display = "none";

    bookDetailsContainer.appendChild(chaptersContainer);

    function toggleDescriptionAndChapters() {
      if (this === descriptTextContainer) {
        descriptContainer.style.display = "block";
        chaptersContainer.style.display = "none";
        descriptTextContainer.textContent = "Synopsis";
        chapterTextContainer.textContent = "Chapters";
      } else {
        descriptContainer.style.display = "none";
        chaptersContainer.style.display = "block";
        displayChapters();
        descriptTextContainer.textContent = "Synopsis";
      }
    }

    async function displayChapters() {
      try {
        const user = auth.currentUser;
        let userData;
        if (user) {
          const userRef = ref(db, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          userData = userSnapshot.val();
        }

        const chaptersRef = ref(db, `books/${bookId}/chapters`);
        const snapshot = await get(chaptersRef);
        const chapters = snapshot.val();

        chaptersContainer.innerHTML = "";

        if (chapters) {
          let serialNumber = 1;
          for (const chapterId in chapters) {
            const chapter = chapters[chapterId];
            const chapterListItem = document.createElement("div");
            chapterListItem.classList.add("chapter-list-item");

            const chapterLink = document.createElement("a");
            const allowedChapterId = (user && userData && userData.subscribeduser) || serialNumber <= 2 ? chapterId : null;
            chapterLink.href = `displaychapters.html?bookId=${bookId}&chapterId=${allowedChapterId}`;
            chapterLink.textContent = `${serialNumber}. ${chapter.title}`;

            if (!user || (user && !(userData && userData.subscribeduser) && serialNumber > 2)) {
              const lockIcon = document.createElement("i");
              lockIcon.classList.add("bx", "bxs-lock-alt", "lock-icon");
              chapterLink.appendChild(lockIcon);
              chapterLink.addEventListener("click", (event) => {
                event.preventDefault();
                alert("You need to subscribe to read this chapter.");
              });
            }

            chapterListItem.appendChild(chapterLink);

            chaptersContainer.appendChild(chapterListItem);
            serialNumber++;
          }
        } else {
          const noChapterMsg = document.createElement("div");
          noChapterMsg.classList.add("no-data");
          noChapterMsg.textContent = "No chapters available.";
          chaptersContainer.appendChild(noChapterMsg);
          console.log("No chapters.");
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        alert("An error occurred while fetching chapters. Please try again.");
      }
    }


    descriptTextContainer.addEventListener(
      "click",
      toggleDescriptionAndChapters
    );
    chapterTextContainer.addEventListener(
      "click",
      toggleDescriptionAndChapters
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");

  if (bookId) {
    displayBookDetails(bookId);
  } else {
    console.error("Book ID not found in URL parameters");
  }
});


async function writeReview(event) {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    console.log("User not logged in.");
    return;
  }
  const userId = user.uid;
  try {
    const userDetailsRef = ref(db, `users/${userId}`);
    const userDetailsSnapshot = await get(userDetailsRef);
    const userDetails = userDetailsSnapshot.val();
    if (!userDetails) {
      console.log("User details not found.");
      return;
    }
    const isSubscribedUser = userDetails.subscribeduser === true;
    if (!isSubscribedUser) {
      alert("You need to be a subscribed user to write a review.");
      return;
    }
    const reviewTitle = document.getElementById("reviewTitle").value;
    const reviewContent = document.getElementById("reviewContent").value;
    if (!reviewTitle || !reviewContent) {
      alert("Please fill out all review fields.");
      return;
    }

    // Combine title length validation into a single if statement
    if (reviewTitle.length > 30 || reviewContent.length < 20 || reviewContent.length > 1000) {
      alert("Review title should not exceed 30 characters, and content should be between 20 and 1000 characters.");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get("bookId");
    const userReviewRef = ref(db, `books/${bookId}/reviews`);
    const userReviewSnapshot = await get(userReviewRef);
    const userReviews = userReviewSnapshot.val();
    if (userReviews && Object.keys(userReviews).some(reviewId => userReviews[reviewId].userId === userId)) {
      alert("You have already written a review for this book.");
      return;
    }
    try {
      await push(ref(db, `books/${bookId}/reviews`), {
        title: reviewTitle,
        content: reviewContent,
        userId: userId,
        username: userDetails.username
      });
      alert("Review submitted successfully!");
      document.getElementById("reviewTitle").value = "";
      document.getElementById("reviewContent").value = "";
      displayReviews(bookId);
    } catch (error) {
      console.error("Error writing review:", error);
      alert("An error occurred while submitting the review. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    alert("An error occurred while fetching user details. Please try again.");
  }
}



async function displayReviews(bookId) {
  const reviewsContainer = document.getElementById("reviewsContainer");
  reviewsContainer.innerHTML = "";

  try {
    const reviewsRef = ref(db, `books/${bookId}/reviews`);
    const snapshot = await get(reviewsRef);
    const reviews = snapshot.val();

    if (reviews) {
      for (const reviewId in reviews) {
        const review = reviews[reviewId];
        const reviewItem = document.createElement("div");
        reviewItem.classList.add("review-item");

        const reviewTitle = document.createElement("h3");
        reviewTitle.textContent = `Review Title: ${review.title}`;

        const reviewContent = document.createElement("p");
        reviewContent.classList.add('reviewcontent')
        reviewContent.textContent = `Review Content: ${review.content}`;

        const reviewerInfo = document.createElement("p");
        reviewerInfo.classList.add('reviewer')
        reviewerInfo.textContent = `Reviewed by: ${review.username}`;

        reviewItem.appendChild(reviewTitle);
        reviewItem.appendChild(reviewContent);
        reviewItem.appendChild(reviewerInfo);

        reviewsContainer.appendChild(reviewItem);
      }
    } else {
      const noReviewMsg = document.createElement("p");
      noReviewMsg.textContent = "No reviews yet.";
      reviewsContainer.appendChild(noReviewMsg);
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
    alert("An error occurred while fetching reviews. Please try again.");
  }
}

onAuthStateChanged(auth, (user) => {
  const writeReviewForm = document.getElementById("writeReviewForm");
  if (user && writeReviewForm) {
    writeReviewForm.addEventListener("submit", writeReview);
  } else {
    if (writeReviewForm) {
      writeReviewForm.style.display = "none";
    }
    console.log("User not logged in.");
  }
});

// Call displayReviews function when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");

  if (bookId) {
    displayReviews(bookId);
  } else {
    console.error("Book ID not found in URL parameters");
  }
});

// Function to display random books
async function displayRandomBooks() {
  try {
    const booksRef = ref(db, "books");
    const snapshot = await get(booksRef);
    const allBooks = snapshot.val();

    const randomBookIds = Object.keys(allBooks)
      .sort(() => 0.5 - Math.random())
      .slice(0, 15);

    const randomBooksContainer = document.getElementById("randomBooksContainer");
    randomBooksContainer.innerHTML = "";

    const title = document.createElement("p");
    title.textContent = "You might also like";
    randomBooksContainer.appendChild(title);

    const booksGrid = document.createElement("div");
    booksGrid.classList.add("books-grid");
    randomBooksContainer.appendChild(booksGrid);

    randomBookIds.forEach((bookId) => {
      const bookData = allBooks[bookId];

      const bookContainer = document.createElement("div");
      bookContainer.classList.add("book-container");

      const image = document.createElement("img");
      image.src = bookData.imageUrl;
      image.alt = "Book Cover";
      image.classList.add("book-image");

      const title = document.createElement("h3");
      title.textContent = bookData.title;
      title.classList.add("book-title");

      bookContainer.addEventListener("click", () => {
        window.location.href = `previewpage.html?bookId=${bookId}`;
      });

      bookContainer.appendChild(image);
      bookContainer.appendChild(title);

      booksGrid.appendChild(bookContainer);
    });
  } catch (error) {
    console.error("Error fetching random books:", error);
    alert("An error occurred while fetching random books. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  displayRandomBooks();
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

