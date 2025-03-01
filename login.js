// ✅ Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// ✅ Firebase Configuration (Same as in `admin.js`)
const firebaseConfig = {
    apiKey: "AIzaSyDTYFKOmMnP38s2Khb3kPI_pme4DpJn6l0",
    authDomain: "henna-7e094.firebaseapp.com",
    databaseURL: "https://henna-7e094-default-rtdb.firebaseio.com",
    projectId: "henna-7e094",
    storageBucket: "henna-7e094.appspot.com",
    messagingSenderId: "1087217375273",
    appId: "1:1087217375273:web:71c5c47b2800857d2e2438",
    measurementId: "G-ZHEWB3EZCG"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Form elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const loginButton = document.querySelector(".login-button");

// ✅ Login Form Submission
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    
    // Show loading state
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginButton.disabled = true;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Hide any previous errors
    loginError.classList.remove("show");
    loginError.innerText = "";

    // ✅ Sign in Admin
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("✅ Login successful!");
            
            // Show success message briefly before redirect
            loginError.style.backgroundColor = "#e8f5e9";
            loginError.style.color = "#388e3c";
            loginError.innerText = "Login successful! Redirecting...";
            loginError.classList.add("show");
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = "index.html"; // Redirect to dashboard
            }, 1000);
        })
        .catch((error) => {
            console.error("❌ Login failed:", error.message);
            
            // Determine appropriate error message
            let errorMessage = "Invalid login credentials. Please try again.";
            
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Too many failed attempts. Please try again later.";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Network error. Please check your connection.";
            }
            
            // Display error with animation
            loginError.innerText = errorMessage;
            loginError.classList.add("show");
            
            // Reset button state
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginButton.disabled = false;
        });
});

// ✅ Input validation and visual feedback
emailInput.addEventListener("input", function() {
    validateEmail(this);
});

passwordInput.addEventListener("input", function() {
    validatePassword(this);
});

// Simple email validation
function validateEmail(input) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(input.value)) {
        input.style.borderColor = "#4CAF50";
    } else if (input.value === "") {
        input.style.borderColor = "#d4a76a";
    } else {
        input.style.borderColor = "#e74c3c";
    }
}

// Simple password validation (at least 6 characters)
function validatePassword(input) {
    if (input.value.length >= 6) {
        input.style.borderColor = "#4CAF50";
    } else if (input.value === "") {
        input.style.borderColor = "#d4a76a";
    } else {
        input.style.borderColor = "#e74c3c";
    }
}