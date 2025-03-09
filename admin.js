// ✅ Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getDatabase, ref, onValue, remove, get } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

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

// ✅ Add Check Duplicates Button Event Listener
document.getElementById("checkDuplicatesBtn").addEventListener("click", function() {
    findAndMarkDuplicates();
});

// ✅ Add Delete All Duplicates Button Event Listener
document.getElementById("deleteDuplicatesBtn").addEventListener("click", function() {
    deleteAllDuplicates();
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
            <td colspan="9" class="no-results">No bookings found matching your search</td>
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
        
        // Add duplicate class if marked as duplicate
        if (booking.isDuplicate) {
            row.classList.add('duplicate-row');
        }
        
        row.innerHTML = `
            <td><span class="booking-id">${displayId}</span></td>
            <td>${booking.name}</td>
            <td>${booking.contact}</td>
            <td>${formatDate(booking.date)}</td>
            <td>${booking.design_id || "N/A"}</td>
            <td>${booking.message || "N/A"}</td>
            <td>${booking.time || "N/A"}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
            <td>
                <button class="delete-btn" data-id="${booking.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-id');
            deleteBooking(bookingId);
        });
    });
}

// ✅ Delete a booking
function deleteBooking(bookingId) {
    if (confirm("Are you sure you want to delete this booking?")) {
        const bookingRef = ref(database, `bookings/${bookingId}`);
        
        remove(bookingRef)
            .then(() => {
                showNotification("Booking deleted successfully!", "success");
                // Refresh is not needed since onValue will trigger
            })
            .catch((error) => {
                console.error("Error deleting booking:", error);
                showNotification("Error deleting booking. Please try again.", "error");
            });
    }
}

// ✅ Find and mark duplicate bookings
function findAndMarkDuplicates() {
    // Reset isDuplicate flag on all bookings
    allBookings.forEach(booking => {
        booking.isDuplicate = false;
    });
    
    const duplicates = [];
    
    // Create a map to detect duplicates
    const bookingMap = new Map();
    
    allBookings.forEach(booking => {
        // Create a composite key based on name, contact, and date
        const key = `${booking.name.toLowerCase()}|${booking.contact}|${booking.date}`;
        
        if (bookingMap.has(key)) {
            // This is a duplicate
            duplicates.push(booking.id);
            booking.isDuplicate = true;
            
            // Also mark the original booking
            const originalId = bookingMap.get(key);
            const originalBooking = allBookings.find(b => b.id === originalId);
            if (originalBooking) {
                originalBooking.isDuplicate = true;
                if (!duplicates.includes(originalId)) {
                    duplicates.push(originalId);
                }
            }
        } else {
            // First occurrence
            bookingMap.set(key, booking.id);
        }
    });
    
    if (duplicates.length === 0) {
        showNotification("No duplicate bookings found!", "info");
    } else {
        showNotification(`Found ${duplicates.length} duplicate bookings!`, "warning");
        // Re-render with duplicates highlighted
        renderBookings();
    }
}

// ✅ Delete all duplicate bookings
function deleteAllDuplicates() {
    const duplicates = allBookings.filter(booking => booking.isDuplicate);
    
    if (duplicates.length === 0) {
        showNotification("No duplicates to delete!", "info");
        return;
    }
    
    if (confirm(`Are you sure you want to delete all ${duplicates.length} duplicate bookings? This cannot be undone.`)) {
        const deletePromises = [];
        const duplicateMap = new Map();
        
        // Group duplicates by their composite key and keep only the oldest booking
        duplicates.forEach(booking => {
            const key = `${booking.name.toLowerCase()}|${booking.contact}|${booking.date}`;
            
            if (!duplicateMap.has(key)) {
                duplicateMap.set(key, booking);
            } else {
                const existingBooking = duplicateMap.get(key);
                const existingDate = new Date(existingBooking.id.substring(0, 13));
                const currentDate = new Date(booking.id.substring(0, 13));
                
                // If this booking is newer, keep the older one and delete this one
                if (currentDate > existingDate) {
                    const bookingRef = ref(database, `bookings/${booking.id}`);
                    deletePromises.push(remove(bookingRef));
                } else {
                    // Otherwise delete the older entry and keep this one
                    const bookingRef = ref(database, `bookings/${existingBooking.id}`);
                    deletePromises.push(remove(bookingRef));
                    duplicateMap.set(key, booking);
                }
            }
        });
        
        Promise.all(deletePromises)
            .then(() => {
                showNotification(`Successfully deleted ${deletePromises.length} duplicate bookings!`, "success");
                // onValue will update the UI
            })
            .catch(error => {
                console.error("Error deleting duplicates:", error);
                showNotification("Error deleting duplicates. Please try again.", "error");
            });
    }
}

// ✅ Notification system
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
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

// Add CSS for deletion and duplicate handling
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
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.duplicate-actions {
    display: flex;
    gap: 10px;
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

/* Delete button styling */
.delete-btn {
    background-color: #ffebee;
    color: #e53935;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.delete-btn:hover {
    background-color: #e53935;
    color: white;
    transform: scale(1.1);
}

.delete-btn .fas {
    margin-right: 0;
}

/* Style for duplicate rows */
.duplicate-row {
    background-color: #ffecb3 !important;
    position: relative;
}

.duplicate-row::before {
    content: "Duplicate";
    position: absolute;
    top: 0;
    left: 0;
    font-size: 10px;
    background: #ff9800;
    color: white;
    padding: 2px 5px;
    border-radius: 0 0 5px 0;
    font-weight: bold;
}

/* Manage duplicate buttons */
.action-btn {
    padding: 8px 15px;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

#checkDuplicatesBtn {
    background-color: #fff8e1;
    color: #ff9800;
    border: 1px solid #ff9800;
}

#checkDuplicatesBtn:hover {
    background-color: #ff9800;
    color: white;
}

#deleteDuplicatesBtn {
    background-color: #ffebee;
    color: #e53935;
    border: 1px solid #e53935;
}

#deleteDuplicatesBtn:hover {
    background-color: #e53935;
    color: white;
}

/* Notification system */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 350px;
    max-width: 90%;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    z-index: 1000;
}

.notification.notification-show {
    transform: translateX(0);
}

.notification.notification-hide {
    transform: translateX(120%);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification.success {
    border-left: 4px solid #4caf50;
}

.notification.error {
    border-left: 4px solid #f44336;
}

.notification.warning {
    border-left: 4px solid #ff9800;
}

.notification.info {
    border-left: 4px solid #2196f3;
}

.notification.success i {
    color: #4caf50;
}

.notification.error i {
    color: #f44336;
}

.notification.warning i {
    color: #ff9800;
}

.notification.info i {
    color: #2196f3;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border-radius: 50%;
    transition: background 0.2s ease;
}

.notification-close:hover {
    background: #f0f0f0;
}

.notification i {
    font-size: 18px;
}
</style>
`);
