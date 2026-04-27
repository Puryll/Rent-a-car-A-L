import { db, RentACar, getDocs, deleteDoc, doc, updateDoc, addDoc } from "./firebase.js";
import { collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const adminLoginForm = document.getElementById('adminLoginForm');
const adminMessage = document.getElementById('adminMessage');
let searchInput;
let ratingFilter;
let allComments = [];
let allBookings = [];

adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const email = document.getElementById('adminEmail').value;

    if (username === 'Puryll' && password === 'Alyrap1234' && email === 'YllPllana11@outlook.com') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        adminMessage.textContent = '';
        // Initialize dashboard
        initializeDashboard();
    } else {
        adminMessage.textContent = 'Invalid credentials';
    }
});

function initializeDashboard() {
    const tabButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const refreshBtn = document.getElementById('refreshBtn');
    searchInput = document.getElementById('searchComments');
    ratingFilter = document.getElementById('ratingFilter');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
        });
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0)';
            loadAnalytics();
            loadComments();
            loadBookings();
            loadCars();
        }, 500);
    });

    searchInput.addEventListener('input', filterComments);
    ratingFilter.addEventListener('change', filterComments);

    loadAnalytics();
    loadComments();
    loadBookings();
    loadCars();
}

async function loadAnalytics() {
    try {
        const viewsRef = collection(db, 'analytics');
        const viewQuery = query(viewsRef, limit(100));
        const viewSnap = await getDocs(viewQuery);
        
        const bookingsRef = collection(db, 'bookings');
        const bookingsSnap = await getDocs(bookingsRef);
        
        const commentsRef = collection(db, 'comments');
        const commentsSnap = await getDocs(commentsRef);
        
        let totalViews = 0;
        let totalRating = 0;
        
        viewSnap.forEach(doc => {
            totalViews += doc.data().count || 0;
        });
        
        allComments = [];
        commentsSnap.forEach(doc => {
            allComments.push({ id: doc.id, ...doc.data() });
            totalRating += doc.data().rating || 0;
        });
        
        allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        document.getElementById('totalViews').textContent = totalViews || 0;
        document.getElementById('totalBookings').textContent = bookingsSnap.size || 0;
        document.getElementById('totalComments').textContent = allComments.length || 0;
        
        const avgRating = allComments.length > 0 ? (totalRating / allComments.length).toFixed(1) : 0;
        document.getElementById('averageRating').textContent = avgRating;
        
        loadActivity();
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    if (allComments.length === 0) {
        activityList.innerHTML = '<p class="no-data">No activity yet</p>';
        return;
    }
    
    allComments.slice(0, 10).forEach(comment => {
        const date = comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Unknown date';
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <p><strong>${comment.name}</strong> left a ${comment.rating}-star comment</p>
            <p>"${comment.text.substring(0, 80)}${comment.text.length > 80 ? '...' : ''}"</p>
            <p class="activity-time">${date}</p>
        `;
        activityList.appendChild(activityItem);
    });
}

async function loadComments() {
    try {
        const commentsRef = collection(db, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allComments = [];
        querySnapshot.forEach(doc => {
            allComments.push({ id: doc.id, ...doc.data() });
        });
        
        filterComments();
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function filterComments() {
    const searchTerm = searchInput.value.toLowerCase();
    const ratingValue = ratingFilter.value;
    
    let filtered = allComments.filter(comment => {
        const matchesSearch = comment.name.toLowerCase().includes(searchTerm) || 
                            comment.text.toLowerCase().includes(searchTerm);
        const matchesRating = !ratingValue || comment.rating === parseInt(ratingValue);
        return matchesSearch && matchesRating;
    });
    
    displayComments(filtered);
}

function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-data">No comments found</p>';
        return;
    }
    
    comments.forEach(comment => {
        const date = comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Unknown date';
        const stars = '⭐'.repeat(comment.rating);
        
        const commentCard = document.createElement('div');
        commentCard.className = 'comment-card';
        commentCard.innerHTML = `
            <div class="comment-header">
                <span class="comment-name">${comment.name}</span>
                <span class="comment-rating">${stars} (${comment.rating}/5)</span>
            </div>
            <p class="comment-text">${comment.text}</p>
            <p class="comment-date">${date}</p>
            <button class="delete-btn" onclick="deleteComment('${comment.id}')">Delete</button>
        `;
        commentsList.appendChild(commentCard);
    });
}

window.deleteComment = async function(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            await deleteDoc(doc(db, 'comments', commentId));
            loadComments();
            loadAnalytics();
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    }
};

window.deleteBooking = async function(bookingId) {
    if (confirm('Delete this booking after completion?')) {
        try {
            await deleteDoc(doc(db, 'bookings', bookingId));
            loadBookings();
            loadAnalytics();
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Failed to delete booking');
        }
    }
};

async function loadBookings() {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allBookings = [];
        querySnapshot.forEach(doc => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });
        
        displayBookings();
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function displayBookings() {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';
    
    if (allBookings.length === 0) {
        bookingsList.innerHTML = '<p class="no-data">No bookings recorded yet</p>';
        return;
    }
    
    allBookings.forEach(booking => {
        const date = booking.timestamp ? new Date(booking.timestamp).toLocaleDateString() : 'Unknown date';
        
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-card';
        bookingCard.innerHTML = `
            <h3>Booking Details</h3>
            <div class="booking-details">
                <div class="booking-detail">
                    <p class="booking-detail-label">Car Type</p>
                    <p class="booking-detail-value">${booking.carType || 'Not specified'}</p>
                </div>
                <div class="booking-detail">
                    <p class="booking-detail-label">Price</p>
                    <p class="booking-detail-value">${booking.price || 'Not specified'}</p>
                </div>
                <div class="booking-detail">
                    <p class="booking-detail-label">Date</p>
                    <p class="booking-detail-value">${date}</p>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteBooking('${booking.id}')">Mark complete</button>
        `;
        bookingsList.appendChild(bookingCard);
    });
}

async function loadCars() {
    try {
        const carsRef = collection(db, 'cars');
        const querySnapshot = await getDocs(carsRef);
        
        const carsList = document.getElementById('carsList');
        carsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            // Initialize with default cars
            const defaultCars = [
                { name: 'BMW X1 AUTOMATIK', price: '€35/day', status: 'available', rentedUntil: null },
                { name: 'Golf 7 Automatik', price: '€35/day', status: 'available', rentedUntil: null },
                { name: 'Golf 6 Plus', price: '€30/day', status: 'available', rentedUntil: null },
                { name: 'Golf 7 Automatik 2', price: '€35/day', status: 'available', rentedUntil: null },
                { name: 'Golf 7 Automatik 3', price: '€35/day', status: 'available', rentedUntil: null },
                { name: 'Golf 7 Automatik 4', price: '€35/day', status: 'available', rentedUntil: null },
            ];
            
            for (const car of defaultCars) {
                await addDoc(carsRef, car);
            }
            
            // Reload after adding
            loadCars();
            return;
        }
        
        querySnapshot.forEach(doc => {
            const car = { id: doc.id, ...doc.data() };
            const carCard = document.createElement('div');
            carCard.className = 'car-card';
            carCard.innerHTML = `
                <div class="car-header">
                    <h3 class="car-name">${car.name}</h3>
                    <span class="car-status ${car.status}">${car.status.toUpperCase()}</span>
                </div>
                <div class="car-details">
                    <div class="car-detail">
                        <p class="car-detail-label">Price</p>
                        <p class="car-detail-value">${car.price}</p>
                    </div>
                    <div class="car-detail">
                        <p class="car-detail-label">Status</p>
                        <p class="car-detail-value">${car.status}</p>
                    </div>
                    <div class="car-detail">
                        <p class="car-detail-label">Rented Until</p>
                        <p class="car-detail-value">${car.rentedUntil || 'N/A'}</p>
                    </div>
                </div>
                <div class="car-controls">
                    <select id="status-${car.id}">
                        <option value="available" ${car.status === 'available' ? 'selected' : ''}>Available</option>
                        <option value="rented" ${car.status === 'rented' ? 'selected' : ''}>Rented</option>
                    </select>
                    <input type="date" id="date-${car.id}" value="${car.rentedUntil || ''}" placeholder="Rented until">
                    <button onclick="updateCarStatus('${car.id}')">Update</button>
                </div>
            `;
            carsList.appendChild(carCard);
        });
    } catch (error) {
        console.error('Error loading cars:', error);
        document.getElementById('carsList').innerHTML = '<p class="no-data">Error loading cars</p>';
    }
}

window.updateCarStatus = async function(carId) {
    const status = document.getElementById(`status-${carId}`).value;
    const date = document.getElementById(`date-${carId}`).value;
    
    try {
        await updateDoc(doc(db, 'cars', carId), {
            status: status,
            rentedUntil: date || null
        });
        alert(`Updated car to ${status} until ${date || 'N/A'}`);
        loadCars(); // Reload to show changes
    } catch (error) {
        console.error('Error updating car:', error);
        alert('Failed to update car status');
    }
};

setInterval(() => {
    if (document.getElementById('dashboardContainer').style.display !== 'none') {
        loadAnalytics();
    }
}, 30000);
