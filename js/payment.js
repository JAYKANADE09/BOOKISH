import { db, auth } from "./firebaseConfig.mjs";
import { set, ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is logged in.");
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener("submit", handlePayment);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const dataPrice = urlParams.get('price');
        if (dataPrice) {
            const priceLabel = document.getElementById('price');
            if (priceLabel) {
                priceLabel.textContent = `Pay: Rs.${dataPrice}`;
            }
        }

        // Check subscription status when user logs in
        checkSubscriptionStatus(user.uid);
    } else {
        console.log("User not logged in.");
    }
});

async function checkSubscriptionStatus(userId) {
    try {
        const userDetails = await getUserDetails(userId);
        if (userDetails) {
            const { subscribeduser, subscriptionType, subscriptionStart } = userDetails;
            if (subscribeduser) {
                const expirationDate = calculateSubscriptionExpiration(subscriptionType, subscriptionStart);
                const currentDate = new Date();
                if (currentDate > expirationDate) {
                    // Subscription expired, update subscribeduser to false
                    await set(ref(db, `users/${userId}/subscribeduser`), false);
                    console.log("Subscription expired. Set subscribeduser to false.");
                }
            }
        } else {
            console.log("User details not found.");
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
    }
}

function calculateSubscriptionExpiration(subscriptionType, subscriptionStart) {
    const currentDate = new Date(subscriptionStart);
    if (subscriptionType === 'monthly') {
        // Add 1 month to the current date
        currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (subscriptionType === 'yearly') {
        // Add 1 year to the current date
        currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    return currentDate;
}


async function handlePayment(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        console.log("User not logged in.");
        return;
    }
    const userId = user.uid;
    console.log("User ID:", userId);
    try {
        const userDetails = await getUserDetails(userId);
        if (!userDetails) {
            console.log("User details not found.");
            return;
        }
        console.log("User details:", userDetails);
        const email = document.getElementById("s-email").value;
        const country = document.getElementById("s-country").value;
        const cardNumber = document.getElementById("s-cardnumber").value;
        const cardholder = document.getElementById("s-cardholder").value;
        const expMonth = document.getElementById("s-expmonth").value;
        const cvv = document.getElementById("s-cvv").value;

        // Validation for email
        if (!email || !isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        // Validation for country
        if (!country) {
            alert("Please select a country.");
            return;
        }

        // Validation for card number
        if (!cardNumber || !isValidCardNumber(cardNumber)) {
            alert("Please enter a valid card number.");
            return;
        }

        // Validation for cardholder name
        if (!cardholder) {
            alert("Please enter the cardholder's name.");
            return;
        }

   

        // Validation for CVV
        if (!cvv || !isValidCVV(cvv)) {
            alert("Please enter a valid CVV.");
            return;
        }


        console.log("Form Data:", { email, country, cardNumber, cardholder, expMonth, cvv });
        const urlParams = new URLSearchParams(window.location.search);
        const dataPrice = urlParams.get('price');
        console.log("Data Price:", dataPrice);
        const receiptUrl = `/html/receipt.html?cardholder=${encodeURIComponent(cardholder)}
        &dataPrice=${encodeURIComponent(dataPrice)}
        &cardNumber=${encodeURIComponent(cardNumber)}`;
        window.open(receiptUrl, '_blank');
        const userRef = ref(db, `users/${userId}`);
        await set(userRef, { ...userDetails, subscribeduser: true });
        const subscribedUsersRef = ref(db, `users/${userId}/subscribedusers`);
        await set(subscribedUsersRef, {
            email,
            country,
            cardNumber,
            cardholder,
            expMonth,
            cvv,
            dataPrice
        });
        console.log("User details added to subscribedusers node:", userDetails);
        alert("Payment successful!");
        window.location.href = "/index.html";
    } catch (error) {
        console.error("Error handling payment:", error);
        alert("An error occurred. Please try again.");
    }
}

async function getUserDetails(userId) {
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        return snapshot.val();
    } catch (error) {
        console.error("Error fetching user details:", error);
        return null;
    }
}

// Email validation function
function isValidEmail(email) {
    // Use a regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to format card number with spaces after every 4 characters
function formatCardNumber(input) {
    // Remove any existing spaces and non-numeric characters
    const cardNumber = input.value.replace(/\D/g, '');

    // Insert a space after every 4 characters
    const formattedCardNumber = cardNumber.replace(/(.{4})/g, '$1 ').trim();

    // Update the input value with the formatted card number
    input.value = formattedCardNumber;
}


document.getElementById('s-cardnumber').addEventListener('input', function (event) {
    formatCardNumber(event.target);
});

// Function to validate card number length
function isValidCardNumber(cardNumber) {
    // Remove any spaces from the card number
    const trimmedCardNumber = cardNumber.replace(/\s/g, '');

    // Check if the length is exactly 16 characters
    return trimmedCardNumber.length === 16;
}


function isValidExpiryMonth(expMonth) {
    // Check if the format is valid (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expMonth)) {
        return false; // Invalid format
    }

    // Extract the month and year parts from the input
    const [inputMonth, inputYear] = expMonth.split('/').map(part => parseInt(part, 10));

    // Get the current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last two digits of the year
    const currentMonth = currentDate.getMonth() + 1; // Month is zero-based, so add 1

    // Check if the entered year is in the past
    if (inputYear < currentYear) {
        return false;
    }

    // If the entered year is the current year, check if the month is in the past
    if (inputYear === currentYear && inputMonth < currentMonth) {
        return false;
    }

    // Expiry month and year are valid
    return true;
}




// CVV validation function
function isValidCVV(cvv) {
    return cvv.length === 3 && /^\d+$/.test(cvv);
}
