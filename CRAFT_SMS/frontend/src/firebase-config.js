// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA0DV6kD9T3JeS8DN8fIkUcg8qKE5J-iGc",
    authDomain: "craft-sms-5bb1c.firebaseapp.com",
    projectId: "craft-sms-5bb1c",
    storageBucket: "craft-sms-5bb1c.firebasestorage.app",
    messagingSenderId: "885085013969",
    appId: "1:885085013969:web:c9f83645e32ef0582602f0",
    measurementId: "G-TWD2F8DS7Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
