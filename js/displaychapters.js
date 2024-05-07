import { db, auth } from "./firebaseConfig.mjs";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Function to fetch and display chapter details
async function displayChapterDetails(bookId, chapterId) {
  const bookDetailsContainer = document.getElementById("bookDetailsContainer");
  try {
    const [chaptersSnapshot, bookSnapshot] = await Promise.all([
      get(ref(db, `books/${bookId}/chapters`)),
      get(ref(db, `books/${bookId}`))
    ]);
    const chaptersData = chaptersSnapshot.val();
    const bookData = bookSnapshot.val();
    if (chaptersData && bookData) {
      const chapterIds = Object.keys(chaptersData);
      const chapterIndex = chapterIds.indexOf(chapterId);
      bookDetailsContainer.innerHTML = "";
      const bookTitle = document.createElement("h1");
      bookTitle.classList.add("booktitle");
      bookTitle.textContent = bookData.title; 
      bookDetailsContainer.appendChild(bookTitle);
      const backButton = createButton("float-left", "Previous Chapter", () => navigateChapter(-1, bookId, chapterIds, chapterIndex));
      bookDetailsContainer.appendChild(backButton);
      const indexButton = createButton("float-center", "Index", redirectToIndexPage);
      bookDetailsContainer.appendChild(indexButton);
      const nextButton = createButton("float-right", "Next Chapter", () => navigateChapter(1, bookId, chapterIds, chapterIndex));
      bookDetailsContainer.appendChild(nextButton);
      const chapterTitle = document.createElement("h2");
      chapterTitle.textContent = chaptersData[chapterId].title;
      bookDetailsContainer.appendChild(chapterTitle);
      displayChapterContent(chaptersData[chapterId].content, bookDetailsContainer);
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userDetailsSnapshot = await get(ref(db, `users/${userId}`));
        const userDetails = userDetailsSnapshot.val();
        const isSubscribed = userDetails && userDetails.subscribeduser === true;
        if (!isSubscribed && chapterIndex >= 2) {
          blurChapterContent(bookDetailsContainer);
        } else {
          removeBlurFromChapterContent(bookDetailsContainer);
        }
      } else if (chapterIndex >= 2) {
        blurChapterContent(bookDetailsContainer);
      } else {
        removeBlurFromChapterContent(bookDetailsContainer);
      }
    } else {
      console.log("No chapters found for this book.");
    }
  } catch (error) {
    console.error("Error fetching chapter details:", error);
    alert("An error occurred while fetching chapter details. Please try again.");
  }
}

function blurChapterContent(container) {
  const chapterContent = container.querySelector(".chaptercontentdisplay");
  if (chapterContent) {
    chapterContent.classList.add("blur");
  }
}

function removeBlurFromChapterContent(container) {
  const chapterContent = container.querySelector(".chaptercontentdisplay");
  if (chapterContent) {
    chapterContent.classList.remove("blur");
  }
}

function createButton(className, text, onClick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.classList.add(className);
  button.addEventListener("click", onClick);
  return button;
}


function redirectToIndexPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  location.href = `/html/previewpage.html?bookId=${bookId}`;
}

function navigateChapter(step, bookId, chapterIds, chapterIndex) {
  const newIndex = chapterIndex + step;
  if (newIndex >= 0 && newIndex < chapterIds.length) {
    const newChapterId = chapterIds[newIndex]; 
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get("bookId");
    location.href = `/html/displaychapters.html?bookId=${bookId}&chapterId=${newChapterId}`; 
  }
}

function displayChapterContent(content, container) {
  const chapterContent = document.createElement("div");
  chapterContent.classList.add('chaptercontentdisplay');
  chapterContent.innerHTML = content;
  container.appendChild(chapterContent);
}

// Call the displayChapterDetails function when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  const chapterId = urlParams.get("chapterId");

  if (bookId && chapterId) {
    displayChapterDetails(bookId, chapterId);
  } else {
    console.error("Book ID or Chapter ID not found in URL parameters");
    alert('User not Registered. Please Register First!');
  }
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

document.getElementById("bookmarkchpbtn").addEventListener("click", function (event) {
  event.preventDefault(); 
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId"); 
  if (bookId) {
    bookmarkBook(bookId); 
  } else {
    console.error("Book ID not found in URL parameters");
  }
});


// Function to display chapters
async function displayChapters(bookId) {
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

    const chapterContentDiv = document.getElementById("chapterContent");
    chapterContentDiv.innerHTML = "";

    if (chapters) {
      let serialNumber = 1;
      for (const chapterId in chapters) {
        const chapter = chapters[chapterId];
        const chapterListItem = document.createElement("div");
        chapterListItem.classList.add("chapter-list-item");

        const isAllowedChapter = serialNumber <= 2;

        const chapterLink = document.createElement("a");
        chapterLink.href = `displaychapters.html?bookId=${bookId}&chapterId=${chapterId}`;
        chapterLink.textContent = `${serialNumber}. ${chapter.title}`;

        chapterListItem.appendChild(chapterLink);
        chapterContentDiv.appendChild(chapterListItem);
        serialNumber++;
      }
    } else {
      const noChapterMsg = document.createElement("div");
      noChapterMsg.classList.add("no-data");
      noChapterMsg.textContent = "No chapters available.";
      chapterContentDiv.appendChild(noChapterMsg);
      console.log("No chapters.");
    }
  } catch (error) {
    console.error("Error fetching chapters:", error);
    alert("An error occurred while fetching chapters. Please try again.");
  }
}


const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('bookId');
displayChapters(bookId);

