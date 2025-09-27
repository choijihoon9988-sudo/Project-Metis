// Firebase SDK 스크립트를 import 합니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- 1단계: Firebase 구성 (새로운 프로젝트 정보로 교체됨) ---
const firebaseConfig = {
  apiKey: "AIzaSyAGv3Zy6RpjhQ-fkxXxisXWuPYB24xQ94A",
  authDomain: "metis-project-test.firebaseapp.com",
  projectId: "metis-project-test",
  storageBucket: "metis-project-test.appspot.com", // .appspot.com 으로 끝나야 합니다.
  messagingSenderId: "44158366329",
  appId: "1:44158366329:web:8b731e680819478f3a9aa8"
};

// --- 2단계: Firebase 앱 초기화 및 서비스 내보내기 ---
// Firebase 앱을 초기화합니다.
const app = initializeApp(firebaseConfig);

// 다른 모듈에서 사용할 수 있도록 Auth와 Firestore 인턴스를 가져옵니다.
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- 3단계: 익명 인증 처리 ---
// 사용자가 로그인했는지 확인하고, 안 했다면 익명으로 로그인시키는 함수
export const ensureUserIsAuthenticated = () => {
  return new Promise((resolve) => {
    // onAuthStateChanged는 인증 상태의 변화를 감지하는 리스너입니다.
    // 사용자가 로그인하거나 로그아웃할 때마다 호출됩니다.
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // 사용자가 이미 로그인되어 있는 경우 (익명이든, 일반 계정이든)
        console.log("User is authenticated:", user.uid);
        resolve(user); // 현재 사용자 정보를 반환합니다.
      } else {
        // 사용자가 로그인되어 있지 않은 경우, 익명으로 로그인 시도
        signInAnonymously(auth)
          .then((userCredential) => {
            const anonymousUser = userCredential.user;
            console.log("Signed in anonymously:", anonymousUser.uid);
            resolve(anonymousUser); // 새로 생성된 익명 사용자 정보를 반환합니다.
          })
          .catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            // 에러 상황에서는 null을 반환하거나, 적절한 에러 처리를 할 수 있습니다.
            resolve(null);
          });
      }
    });
  });
};