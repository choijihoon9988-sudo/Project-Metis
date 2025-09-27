// js/firebase.js (수정된 최종 코드)

// Firebase SDK 스크립트를 import 합니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

// --- 1단계: Firebase 구성 ---
const firebaseConfig = {
  apiKey: "AIzaSyAGv3Zy6RpjhQ-fkxXxisXWuPYB24xQ94A",
  authDomain: "metis-project-test.firebaseapp.com",
  projectId: "metis-project-test",
  storageBucket: "metis-project-test.appspot.com",
  messagingSenderId: "44158366329",
  appId: "1:44158366329:web:8b731e680819478f3a9aa8"
};

// --- 2단계: Firebase 앱 초기화 및 서비스 내보내기 ---
// const app을 export const app으로 수정하여 다른 모듈에서 불러올 수 있게 합니다.
export const app = initializeApp(firebaseConfig);

// 다른 모듈에서 사용할 수 있도록 서비스들을 export 합니다.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-northeast3'); // 서울 리전 명시


// --- 3단계: 익명 인증 처리 ---
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