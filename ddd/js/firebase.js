// Firebase SDK 스크립트를 import 합니다.
// dd.html 파일에서 이미 CDN을 통해 전역으로 로드했으므로, 여기서는 타입 힌트만을 위해 import 구문을 사용합니다.
// 실제 브라우저 환경에서는 dd.html의 <script> 태그를 통해 Firebase 라이브러리가 로드됩니다.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- 1단계: Firebase 구성 ---
// Firebase 콘솔에서 복사한 당신의 웹 앱 구성 객체
const firebaseConfig = {
  apiKey: "AIzaSyC3PHEzQiJP00mBnalnfiAceevq1UKYBmk",
  authDomain: "project-metis-c8528.firebaseapp.com",
  projectId: "project-metis-c8528",
  storageBucket: "project-metis-c8528.appspot.com",
  messagingSenderId: "571247226285",
  appId: "1:571247226285:web:38abfbe005bc2e6a084524"
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

// 이 모듈은 Firebase 앱 초기화, 인증 및 Firestore 인스턴스를 설정하고,