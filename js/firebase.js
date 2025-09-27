// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

// 사용자가 제공한 새로운 metisv2 프로젝트 구성 정보
const firebaseConfig = {
  apiKey: "AIzaSyAf6ORBoBpWBMEMWM0xyh31YGR-5jWwTqA",
  authDomain: "metisv2.firebaseapp.com",
  projectId: "metisv2",
  storageBucket: "metisv2.appspot.com",
  messagingSenderId: "958929810493",
  appId: "1:958929810493:web:024b4e6c8f0768c7bf2654"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Goal Navigator 기능을 위해 functions 모듈을 초기화합니다.

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