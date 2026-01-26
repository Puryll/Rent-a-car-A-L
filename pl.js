import { db, RentACar, getDocs, deleteDoc, doc } from "./firebase.js";
import { collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const tabButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchComments');
const ratingFilter = document.getElementById('ratingFilter');

let allComments = [];
let allBookings = [];

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
    }, 500);
});

searchInput.addEventListener('input', filterComments);
ratingFilter.addEventListener('change', filterComments);

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
        `;
        bookingsList.appendChild(bookingCard);
    });
}

loadAnalytics();
loadComments();
loadBookings();

setInterval(() => {
    loadAnalytics();
}, 30000);
