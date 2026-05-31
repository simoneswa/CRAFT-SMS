// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCbWN3PQyl372mgLV2KNpva8MIMOAjeoKc",
    authDomain: "craft-sms-ec3ce.firebaseapp.com",
    projectId: "craft-sms-ec3ce",
    storageBucket: "craft-sms-ec3ce.firebasestorage.app",
    messagingSenderId: "267375895409",
    appId: "1:267375895409:web:aa793babe5ca2284708cd0",
    measurementId: "G-TMQWFSNTW2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);