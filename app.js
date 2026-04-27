import { db, RentACar, getDocs, addDoc, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "./firebase.js";
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

const bookingModal = document.getElementById('bookingModal');
const bookingClose = document.getElementById('bookingClose');
const bookingCarName = document.getElementById('bookingCarName');
const bookingNameInput = document.getElementById('bookingName');
const bookingEmailInput = document.getElementById('bookingEmail');
const bookingUntilInput = document.getElementById('bookingUntil');
const bookingForm = document.getElementById('bookingForm');
const bookingMessage = document.getElementById('bookingMessage');
let currentBookingCar = '';
let currentBookingPrice = '';

document.querySelectorAll('.book-btn').forEach(button => {
    button.addEventListener('click', function () {
        const buttonText = this.textContent.toLowerCase();
        if (buttonText.includes('comming') || buttonText.includes('coming')) {
            alert('This vehicle is not available for booking yet.');
            return;
        }

        const carCard = this.closest('.car-card');
        const carName = carCard.querySelector('h3').textContent;
        const price = carCard.querySelector('.price')?.textContent || '';

        currentBookingCar = carName;
        currentBookingPrice = price;
        bookingCarName.textContent = `${carName} — ${price}`;
        bookingNameInput.value = '';
        bookingEmailInput.value = '';
        bookingUntilInput.value = '';
        bookingMessage.textContent = '';
        bookingUntilInput.min = new Date().toISOString().split('T')[0];
        bookingModal.style.display = 'block';
    });
});

bookingClose.addEventListener('click', () => {
    bookingModal.style.display = 'none';
});

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = bookingNameInput.value.trim();
    const email = bookingEmailInput.value.trim();
    const until = bookingUntilInput.value;

    if (!name || !email || !until) {
        bookingMessage.textContent = 'Please fill in all booking fields.';
        return;
    }

    try {
        const bookingsRef = collection(db, 'bookings');
        await addDoc(bookingsRef, {
            carType: currentBookingCar,
            price: currentBookingPrice,
            name,
            email,
            until,
            timestamp: new Date().getTime()
        });

        const whatsappNumber = '38349641102';
        const message = `New booking from ${name} (${email}) for ${currentBookingCar} until ${until}.`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        bookingModal.style.display = 'none';
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error saving booking:', error);
        bookingMessage.textContent = 'Failed to save your booking. Please try again.';
    }
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

async function loadCarStatuses() {
    try {
        const carsRef = collection(db, 'cars');
        const querySnapshot = await firestoreGetDocs(carsRef);
        
        querySnapshot.forEach(doc => {
            const car = doc.data();
            const badge = document.getElementById(`status-${car.name}`);
            if (badge) {
                badge.textContent = car.status === 'rented' ? 'Rented' : 'Available';
                badge.classList.toggle('rented', car.status === 'rented');
            }
        });
    } catch (error) {
        console.error('Error loading car statuses:', error);
    }
}

loadComments();
loadCarStatuses();

console.log('A&L Car Rentals Website Loaded Successfully!');

// Auth logic
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const guestBtn = document.getElementById('guestBtn');
const closeModal = document.querySelector('.close');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const loginFormEl = document.getElementById('loginFormEl');
const signupFormEl = document.getElementById('signupFormEl');
const authMessage = document.getElementById('authMessage');

let isGuest = false;

loginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
});

guestBtn.addEventListener('click', () => {
    isGuest = true;
    loginBtn.style.display = 'none';
    guestBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    authModal.style.display = 'none';
    updateUIForGuest();
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        isGuest = false;
        loginBtn.style.display = 'inline-block';
        guestBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        updateUIForGuest();
    });
});

closeModal.addEventListener('click', () => {
    authModal.style.display = 'none';
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authModal.style.display = 'none';
        authMessage.textContent = '';
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

signupFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
        authModal.style.display = 'none';
        authMessage.textContent = '';
    } catch (error) {
        authMessage.textContent = error.message;
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.style.display = 'none';
        guestBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        document.querySelectorAll('.requires-auth').forEach(el => el.style.display = 'block');
        isGuest = false;
    } else if (!isGuest) {
        loginBtn.style.display = 'inline-block';
        guestBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        updateUIForGuest();
    }
});

function updateUIForGuest() {
    document.querySelectorAll('.requires-auth').forEach(el => el.style.display = 'none');
}
