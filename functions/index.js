// functions/index.js

// 1. 함수를 가져오는 방식 변경 (최신 v2 스타일)
const {onCall} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const axios = require("axios");
const {GoogleAuth} = require("google-auth-library");
const {VertexAI} = require("@google-cloud/vertexai");

// 2. 함수 전체의 기본 지역을 '서울'로 설정
setGlobalOptions({region: "asia-northeast3"});

// 3. Gemini AI 설정 초기화
const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "asia-northeast3",
  auth: auth,
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-1.0-pro",
});

// Google Books API 키 (이 키는 보안상 서버 환경 변수로 설정하는 것이 더 안전해)
const GOOGLE_BOOKS_API_KEY = "AIzaSyCULah5vm81WCnhcZuhumLO2cJ-82OJXJA";

// 4. 함수를 내보내는 방식 변경 (최신 v2 스타일)
exports.getBookDetails = onCall(async (request) => {
  // v2에서는 request.data 로 데이터에 접근
  const bookTitle = request.data.bookTitle;
  if (!bookTitle) {
    // v2에서는 에러를 던지는 방식이 다름
    throw new onCall.HttpsError(
        "invalid-argument",
        "책 제목(bookTitle)이 필요합니다.",
    );
  }

  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      bookTitle,
  )}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1&lang=ko`;

  try {
    const response = await axios.get(apiUrl);

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`'${bookTitle}'에 대한 검색 결과가 없습니다.`);
      return { toc: [] };
    }
    
    const book = response.data.items[0].volumeInfo;

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
      
      let toc = [];
      try {
        const cleanedJson = text.replace(/^```json\s*|```\s*$/g, "").trim();
        toc = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("AI 응답 JSON 파싱 실패:", parseError);
        console.error("파싱 전 원본 AI 응답:", text);
        return { toc: [] };
      }
      
      return { toc: toc };
    } else {
      console.log(`'${bookTitle}'의 책 정보에 'description' 필드가 없습니다.`);
      return { toc: [] };
    }
  } catch (error) {
    console.error("서버 함수 실행 중 심각한 오류 발생:", error.message);
    throw new onCall.HttpsError(
        "unknown",
        `목차 정보 분석 중 AI 또는 API 오류 발생: ${error.message}`,
    );
  }
});