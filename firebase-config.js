import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0Oo9LjH51c974BsKXlEWQiqlSyBqb2cI",
  authDomain: "faceboo-b56ab.firebaseapp.com",
  databaseURL: "https://faceboo-b56ab-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "faceboo-b56ab",
  storageBucket: "faceboo-b56ab.appspot.com",
  messagingSenderId: "930257782258",
  appId: "1:930257782258:web:61f9fcdf4019248238976b",
  measurementId: "G-QT6G59RH8L"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db   = getFirestore(app);
