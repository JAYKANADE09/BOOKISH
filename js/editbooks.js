import { auth, db } from "./firebaseConfig.mjs";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  set,
  ref,
  get,
  push,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

function getBookIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("bookId");
}

// Function to edit book details
async function editBookDetails() {
  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const bookId = getBookIdFromURL();
        console.log("Book ID from URL parameter:", bookId);
        if (bookId) {
          const bookRef = ref(db, `books/${bookId}`);
          const snapshot = await get(bookRef);
          if (snapshot.exists()) {
            const book = snapshot.val();
            console.log("Retrieved book details:", book);
            document.getElementById("editbookTitle").value = book.title;
            document.getElementById("edittags").value = book.tags.join(", ");
            document.getElementById("editdescription").value = book.description;
            document.getElementById("edituploadedImage").src = book.imageUrl;
            const editIcons = document.querySelectorAll('.bx.bxs-edit');
            editIcons.forEach(icon => {
              icon.addEventListener('click', () => {
                const field = icon.parentElement.querySelector('input, textarea');
                makeEditable(field);
              });
            });
            const selectedGenres = book.genres;
            const genreCheckboxes = document.querySelectorAll('input[name="genre"]');
            genreCheckboxes.forEach((checkbox) => {
              checkbox.checked = selectedGenres.includes(checkbox.value);
            });
            document.getElementById("editBookForm").style.display = "block";
          } else {
            console.error("Book not found.");
            alert("Book not found. Please try again.");
          }
        } else {
          console.error("No book ID found in URL parameter.");
          alert("No book ID found in URL parameter.");
        }
      } else {
        console.log("User not authenticated.");
      }
    });
  } catch (error) {
    console.error("Error editing book details:", error);
    alert("An error occurred while editing book details. Please try again.");
  }
}

function makeEditable(field) {
  field.removeAttribute('readonly');
  field.focus();
}

document.addEventListener("DOMContentLoaded", editBookDetails);

document.getElementById("saveChangesBookBtn").addEventListener("click", async function (event) {
  event.preventDefault();

  // Check form validation before submitting
  if (!validateForm()) {
    // If form is not valid, return without submitting the form
    return;
  }

  // Form is valid, continue with form submission
  const bookId = getBookIdFromURL();
  console.log("Saving changes for book ID:", bookId);
  if (bookId) {
    await submitEditedBookDetails(bookId);
  } else {
    console.error("No book ID found in URL parameter.");
    alert("No book ID found in URL parameter.");
  }
});


async function submitEditedBookDetails(bookId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("User not authenticated.");
      return;
    }

    console.log("Submitting edited book details for book ID:", bookId);

    const userSnapshot = await get(ref(db, `users/${currentUser.uid}`));
    const username = userSnapshot.val().username;

    const title = document.getElementById("editbookTitle").value;
    const selectedGenres = Array.from(
      document.querySelectorAll('input[name="genre"]:checked')
    ).map((checkbox) => checkbox.value);

    console.log("Selected genres:", selectedGenres);

    if (selectedGenres.length > 3) {
      alert("Please select up to three genres.");
      return;
    }

    const tags = document
      .getElementById("edittags")
      .value.split(",")
      .map((tag) => tag.trim());
    const description = document.getElementById("editdescription").value;
    const imageUrl = document.getElementById("edituploadedImage").src;

    console.log("Form values:", title, selectedGenres, tags, description, imageUrl);

    const bookRef = ref(db, `books/${bookId}`);
    const snapshot = await get(bookRef);

    if (!snapshot.exists()) {
      console.error("Book not found.");
      alert("Book not found. Please try again.");
      return;
    }

    const oldBook = snapshot.val();

    await Promise.all(
      oldBook.genres.map(async (genre) => {
        const genreBookRef = ref(db, `genres/${genre}/books/${bookId}`);
        await set(genreBookRef, null);
      })
    );

    await Promise.all(
      oldBook.tags.map(async (tag) => {
        const tagBookRef = ref(db, `tags/${tag}/books/${bookId}`);
        await set(tagBookRef, null);
      })
    );

    const updatedBook = {
      title: title,
      genres: selectedGenres,
      tags: tags,
      description: description,
      imageUrl: imageUrl,
      email: currentUser.email,
      username: username,
    };

    await set(bookRef, updatedBook);

    console.log("Updated book details:", updatedBook);

    await Promise.all(
      tags.map(async (tag) => {
        const tagBookRef = ref(db, `tags/${tag}/books/${bookId}`);
        await set(tagBookRef, updatedBook);
      })
    );

    await Promise.all(
      selectedGenres.map(async (genre) => {
        const genreBookRef = ref(db, `genres/${genre}/books/${bookId}`);
        await set(genreBookRef, updatedBook);
      })
    );

    document.getElementById("editBookForm").style.display = "none";

    alert("Book details updated successfully!");
    window.location.href = "/html/authordashboard.html";
  } catch (error) {
    console.error("Error updating book details:", error);
    alert("An error occurred while updating book details. Please try again.");
  }
}

// Function to validate the form fields
function validateForm() {
  // Get form input values
  const bookTitle = document.getElementById("editbookTitle").value;
  const selectedGenres = document.querySelectorAll('input[name="genre"]:checked');
  const tags = document.getElementById("edittags").value;
  const description = document.getElementById("editdescription").value;
  const imageInput = document.getElementById("editfileInput");
  const uploadedImage = document.getElementById("edituploadedImage");

  if (!uploadedImage.src || uploadedImage.src === "" || (imageInput.files && imageInput.files.length > 0)) {
    alert("Please upload an image for the book cover.");
    return false;
  }

  // Remove existing details if the respective field is left empty
  if (bookTitle === "") {
    alert("Please enter a book title.");
    return false;
  }

  if (selectedGenres.length === 0) {
    alert("Please select at least one genre.");
    return false;
  }

  if (tags === "") {
    alert("Please enter at least one tag.");
    return false;
  }

  if (description === "") {
    alert("Please enter a book description.");
    return false;
  }

  // Content length validation (optional)
  if (description.length > 5000) {
    alert("Chapter description should not exceed 5000 characters.");
    return false;
  }


  return true; 
}