import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
  import { getFirestore,
         collection,
         addDoc,
         getDocs,
         doc,
         updateDoc,
         deleteDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyAxnu580Dk830IzQ94PfqWPSKM0tHFUr5s",
    authDomain: "rent-a-car-aandl.firebaseapp.com",
    projectId: "rent-a-car-aandl",
    storageBucket: "rent-a-car-aandl.firebasestorage.app",
    messagingSenderId: "236485298447",
    appId: "1:236485298447:web:b9d20412928be91efcd67a",
    measurementId: "G-DNS7KNWLQY"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);

  const RentACar = collection(db, "Rent-a-car");

  export {
    db,
    RentACar,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
  }