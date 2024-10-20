require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  databaseURL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCX6fzaJtTQs7uflfyajP4xf5omEFfAcvI",
  authDomain: "kep-ket.firebaseapp.com",
  projectId: "kep-ket",
  storageBucket: "kep-ket.appspot.com",
  messagingSenderId: "366461947082",
  appId: "1:366461947082:web:e4299e5a8c91198018f833",
  measurementId: "G-GM08E91GXP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
