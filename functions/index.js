// functions/index.js

const functions = require("firebase-functions");
const axios = require("axios");
// 1. 필요한 라이브러리들을 가져옵니다.
const {GoogleAuth} = require("google-auth-library");
const {VertexAI} = require("@google-cloud/vertexai");

// 2. Gemini AI 설정을 초기화합니다.
const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "asia-northeast3", // 서울 리전
  auth: auth,
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-1.0-pro",
});

const GOOGLE_BOOKS_API_KEY = "AIzaSyCULah5vm81WCnhcZuhumLO2cJ-82OJXJA"; // 기존 API 키

// 3. 서버의 위치(region)를 'asia-northeast3'(서울)으로 지정합니다.
exports.getBookDetails = functions.region("asia-northeast3").https.onCall(async (data, context) => {
  const bookTitle = data.bookTitle;
  if (!bookTitle) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "책 제목(bookTitle)이 필요합니다.",
    );
  }

  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      bookTitle,
  )}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1&lang=ko`;

  try {
    const response = await axios.get(apiUrl);
    const book = response.data.items && response.data.items.length > 0 ?
      response.data.items[0].volumeInfo :
      null;

    if (book && book.description) {
      const prompt = `
        다음 텍스트에서 책의 목차 정보만 추출해서 아래와 같은 JSON 형식으로 만들어줘.
        다른 설명은 모두 제외하고, 오직 JSON 데이터만 반환해야 해.
        만약 목차 정보가 없다면 빈 배열 []을 반환해줘.

        [
          { "part": "1부 제목", "chapters": ["1장 제목", "2장 제목"] },
          { "part": "2부 제목", "chapters": ["3장 제목", "4장 제목"] }
        ]

        --- 원본 텍스트 ---
        ${book.description}
      `;

      const result = await model.generateContent(prompt);
      const aiResponse = await result.response;
      const text = aiResponse.text();
      
      const cleanedJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const toc = JSON.parse(cleanedJson);
      return {toc: toc};
    } else {
      return {toc: []};
    }
  } catch (error) {
    console.error("서버 함수 실행 중 오류 발생:", error);
    // 앱에서 에러를 쉽게 확인할 수 있도록 에러 메시지를 함께 반환합니다.
    throw new functions.https.HttpsError(
        "unknown",
        `목차 정보 분석 중 AI 또는 API 오류 발생: ${error.message}`,
    );
  }
});