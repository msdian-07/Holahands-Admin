// ✅ Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

// ✅ Firebase Configuration
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
const database = getDatabase(app);

// Global variables to store bookings and current sorting state
let allBookings = [];
let currentSortColumn = "date";
let sortDirection = "desc";
let searchTerm = "";

// ✅ Restrict Access to Logged-in Admins
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.warn("❌ Access Denied! Redirecting to login...");
        window.location.href = "login.html";
    } else {
        console.log("✅ Welcome Admin:", user.email);
        // Add welcome message or additional UI elements if needed
    }
});

// ✅ Logout Function
document.getElementById("logoutButton").addEventListener("click", function () {
    signOut(auth).then(() => {
        console.log("✅ Admin logged out.");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("❌ Error logging out:", error);
    });
});

// ✅ Initialize Search Bar Event Listener
document.getElementById("searchBar").addEventListener("input", function() {
    searchTerm = this.value.toLowerCase();
    renderBookings();
});

// ✅ Add Sort Event Handlers
document.addEventListener("DOMContentLoaded", function() {
    const tableHeaders = document.querySelectorAll("th[data-sort]");
    
    tableHeaders.forEach(header => {
        header.addEventListener("click", function() {
            const column = this.getAttribute("data-sort");
            
            // Toggle direction if clicking the same column
            if (currentSortColumn === column) {
                sortDirection = sortDirection === "asc" ? "desc" : "asc";
            } else {
                currentSortColumn = column;
                sortDirection = "asc";
            }
            
            // Update visual indicators
            tableHeaders.forEach(th => {
                th.classList.remove("sort-asc", "sort-desc");
            });
            
            this.classList.add(`sort-${sortDirection}`);
            
            renderBookings();
        });
    });
});

// ✅ Sorting function
function sortBookings(bookings) {
    return bookings.sort((a, b) => {
        let valueA = a[currentSortColumn];
        let valueB = b[currentSortColumn];
        
        // Special handling for date comparisons
        if (currentSortColumn === "date") {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }
        
        // Handle null or undefined values
        if (valueA === undefined || valueA === null) valueA = "";
        if (valueB === undefined || valueB === null) valueB = "";
        
        // For string comparisons
        if (typeof valueA === "string" && typeof valueB === "string") {
            const comparison = valueA.localeCompare(valueB);
            return sortDirection === "asc" ? comparison : -comparison;
        }
        
        // For number and date comparisons
        const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
    });
}

// ✅ Filter function
function filterBookings(bookings) {
    if (!searchTerm) return bookings;
    
    return bookings.filter(booking => {
        return (
            booking.id.toLowerCase().includes(searchTerm) ||
            booking.name.toLowerCase().includes(searchTerm) ||
            booking.contact.toLowerCase().includes(searchTerm) ||
            booking.date.toLowerCase().includes(searchTerm) ||
            (booking.design_id && booking.design_id.toLowerCase().includes(searchTerm)) ||
            (booking.message && booking.message.toLowerCase().includes(searchTerm)) ||
            (booking.time && booking.time.toLowerCase().includes(searchTerm))
        );
    });
}

// ✅ Render bookings table
function renderBookings() {
    const tableBody = document.getElementById("bookingTableBody");
    tableBody.innerHTML = ""; // Clear table
    
    // Apply search filter
    const filteredBookings = filterBookings(allBookings);
    
    // Sort the filtered bookings
    const sortedBookings = sortBookings(filteredBookings);
    
    // Update stats
    updateStats(filteredBookings);
    
    // No results message
    if (sortedBookings.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="8" class="no-results">No bookings found matching your search</td>
        `;
        tableBody.appendChild(row);
        return;
    }
    
    const today = new Date();
    
    // Render each booking
    sortedBookings.forEach(booking => {
        // Determine status based on date
        const bookingDate = new Date(booking.date);
        let status = '';
        let statusClass = '';
        
        if (bookingDate < today) {
            status = 'Completed';
            statusClass = 'completed';
        } else if (bookingDate.toDateString() === today.toDateString()) {
            status = 'Today';
            statusClass = 'today';
        } else {
            status = 'Upcoming';
            statusClass = 'upcoming';
        }

        // Format booking ID (use only first 6 characters for display)
        const displayId = booking.id.substring(0, 6);

        let row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="booking-id">${displayId}</span></td>
            <td>${booking.name}</td>
            <td>${booking.contact}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.design_id || "N/A"}</td>
            <td>${booking.message || "N/A"}</td>
            <td>${booking.time || "N/A"}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// ✅ Update Stats UI with filtered bookings
function updateStats(bookings) {
    const totalBookings = bookings.length;
    let latestBooking = "-";
    let todayBookings = 0;
    
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Sort by date for finding latest
    const sortedForLatest = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedForLatest.length > 0) {
        latestBooking = `${sortedForLatest[0].name} (ID: ${sortedForLatest[0].id.substring(0, 6)})`;
    }
    
    // Count today's bookings
    todayBookings = bookings.filter(booking => booking.date === dateString).length;
    
    // Update UI
    document.getElementById("totalBookings").innerText = totalBookings;
    document.getElementById("recentBooking").innerText = latestBooking;
    document.getElementById("todayBookings").innerText = todayBookings;
    
    // Add animation
    animateStats();
}

// ✅ Load Bookings From Database
const bookingsRef = ref(database, "bookings/");
onValue(bookingsRef, (snapshot) => {
    allBookings = [];
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const booking = childSnapshot.val();
            booking.id = childSnapshot.key;
            allBookings.push(booking);
        });
    }
    
    // Initial render
    renderBookings();
});

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return "N/A";
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Add animation to stats
function animateStats() {
    const statElements = document.querySelectorAll('.stat-card p');
    
    statElements.forEach(element => {
        // Add animation class
        element.classList.add('stat-animated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('stat-animated');
        }, 1000);
    });
}

// Add this CSS to your admin.css file
document.head.insertAdjacentHTML('beforeend', `
<style>
.status {
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.completed {
    background-color: #e0f7fa;
    color: #0097a7;
}

.today {
    background-color: #fff8e1;
    color: #ffa000;
}

.upcoming {
    background-color: #e8f5e9;
    color: #388e3c;
}

.booking-id {
    font-family: monospace;
    font-size: 14px;
    font-weight: 500;
    background: #f7e8d4;
    padding: 3px 8px;
    border-radius: 4px;
    color: #8B4513;
}

.stat-animated {
    animation: countUp 1s ease-out;
}

@keyframes countUp {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.search-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
}

#searchBar {
    padding: 10px 15px;
    border: 2px solid #8B4513;
    border-radius: 20px;
    width: 250px;
    font-size: 14px;
    transition: all 0.3s;
    background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%238B4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') no-repeat;
    background-position: 15px center;
    padding-left: 40px;
}

#searchBar:focus {
    outline: none;
    border-color: #5A2D0C;
    width: 300px;
    box-shadow: 0 0 5px rgba(90, 45, 12, 0.2);
}

th[data-sort] {
    cursor: pointer;
    position: relative;
    user-select: none;
}

th[data-sort]::after {
    content: "⇵";
    margin-left: 5px;
    font-size: 12px;
    opacity: 0.5;
}

th[data-sort].sort-asc::after {
    content: "↑";
    opacity: 1;
}

th[data-sort].sort-desc::after {
    content: "↓";
    opacity: 1;
}

.no-results {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: #888;
}

.fas {
    margin-right: 5px;
}
</style>
`);