// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase config (PASTE FROM CONSOLE)
const firebaseConfig = {
  apiKey: "AIzaSyCPk3RHSceMT-SEZgw94_MqBn99z4X9wcY",
  authDomain: "freelancer-manager-6e842.firebaseapp.com",
  projectId: "freelancer-manager-6e842",
  storageBucket: "freelancer-manager-6e842.firebasestorage.app",
  messagingSenderId: "251072926797",
  appId: "1:251072926797:web:fb2debd68db9505ed7f804"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
