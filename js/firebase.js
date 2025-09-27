// js/firebase.js (최종 수정본)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGv3Zy6RpjhQ-fkxXxisXWuPYB24xQ94A",
  authDomain: "metis-project-test.firebaseapp.com",
  projectId: "metis-project-test",
  storageBucket: "metis-project-test.appspot.com",
  messagingSenderId: "44158366329",
  appId: "1:44158366329:web:8b731e680819478f3a9aa8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const ensureUserIsAuthenticated = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is authenticated:", user.uid);
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            const anonymousUser = userCredential.user;
            console.log("Signed in anonymously:", anonymousUser.uid);
            resolve(anonymousUser);
          })
          .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            resolve(null);
          });
      }
    });
  });
};