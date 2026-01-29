import { db, RentACar, getDocs, addDoc } from "./firebase.js";
import { collection, query, orderBy, limit, getDocs as firestoreGetDocs } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.querySelectorAll('.book-btn').forEach(button => {
    button.addEventListener('click', function (e) {
        recordBooking(this);
        window.open('https://www.facebook.com/almirp', '_blank');
    });
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.car-card, .about-card, .gallery-card').forEach(card => {
    observer.observe(card);
});

document.querySelector('.cta-btn').addEventListener('click', () => {
    window.open('https://www.facebook.com/almirp', '_blank');
});

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    recordPageView();
});

const commentForm = document.getElementById('commentForm');
const userNameInput = document.getElementById('userName');
const commentTextInput = document.getElementById('commentText');
const ratingInputs = document.querySelectorAll('input[name="rating"]');
const commentMessage = document.getElementById('commentMessage');
const ratingDisplay = document.getElementById('ratingDisplay');
const commentsDisplay = document.getElementById('commentsDisplay');

ratingInputs.forEach(input => {
    input.addEventListener('change', () => {
        const rating = input.value;
        ratingDisplay.textContent = `Rating: ${rating} / 5`;
    });
});

commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const text = commentTextInput.value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');

    if (!name || !text || !rating) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        const commentsRef = collection(db, 'comments');
        await addDoc(commentsRef, {
            name: name,
            text: text,
            rating: parseInt(rating.value),
            timestamp: new Date().getTime()
        });

        showMessage('Comment posted successfully! Thank you!', 'success');
        commentForm.reset();
        ratingDisplay.textContent = 'Please select a rating';
        loadComments();
    } catch (error) {
        console.error('Error adding comment:', error);
        showMessage('Error posting comment. Please try again.', 'error');
    }
});

function showMessage(message, type) {
    commentMessage.textContent = message;
    commentMessage.className = 'comment-message ' + type;
    setTimeout(() => {
        commentMessage.textContent = '';
        commentMessage.className = 'comment-message';
    }, 3000);
}

async function loadComments() {
    try {
        const commentsRef = collection(db, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'desc'), limit(6));
        const querySnapshot = await firestoreGetDocs(q);

        commentsDisplay.innerHTML = '';

        if (querySnapshot.empty) {
            commentsDisplay.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const date = new Date(data.timestamp).toLocaleDateString();
            const stars = '⭐'.repeat(data.rating);

            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            commentItem.innerHTML = `
                <div class="comment-header">
                    <span class="comment-name">${escapeHtml(data.name)}</span>
                    <span class="comment-stars">${stars}</span>
                </div>
                <p class="comment-body">${escapeHtml(data.text)}</p>
                <p class="comment-date">${date}</p>
            `;
            commentsDisplay.appendChild(commentItem);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function recordPageView() {
    try {
        const analyticsRef = collection(db, 'analytics');
        const todayKey = new Date().toISOString().split('T')[0];
        
        const q = query(analyticsRef, limit(1));
        const querySnapshot = await firestoreGetDocs(q);
        
        if (querySnapshot.empty) {
            await addDoc(analyticsRef, {
                date: todayKey,
                count: 1,
                timestamp: new Date().getTime()
            });
        }
    } catch (error) {
        console.error('Error recording page view:', error);
    }
}

async function recordBooking(button) {
    try {
        const carType = button.parentElement.querySelector('h3').textContent;
        const price = button.parentElement.querySelector('.price').textContent;
        
        const bookingsRef = collection(db, 'bookings');
        await addDoc(bookingsRef, {
            carType: carType,
            price: price,
            timestamp: new Date().getTime()
        });
    } catch (error) {
        console.error('Error recording booking:', error);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

loadComments();

console.log('A&L Car Rentals Website Loaded Successfully!');
