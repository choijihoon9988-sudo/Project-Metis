// functions/index.js (수정된 코드)

const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { GoogleAuth } = require("google-auth-library");
const { VertexAI } = require("@google-cloud/vertexai");

setGlobalOptions({ region: "asia-northeast3" });

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

exports.generateQuestsForChapter = onCall(async (request) => {
  const { bookTitle, chapterTitle } = request.data;

  if (!bookTitle || !chapterTitle) {
    throw new onCall.HttpsError(
      "invalid-argument",
      "책 제목(bookTitle)과 챕터 제목(chapterTitle)이 모두 필요합니다。",
    );
  }

  try {
    // --- 1단계: 정보 요약 요청 ---
    const summaryPrompt = `
      '${bookTitle}'라는 책의 '${chapterTitle}' 챕터(또는 소주제)의 핵심 내용을 3~5문장으로 요약해줘.
    `;
    const summaryResult = await model.generateContent(summaryPrompt);
    const summaryResponse = await summaryResult.response;
    const chapterSummary = summaryResponse.text();

    if (!chapterSummary || chapterSummary.trim() === "") {
      console.error("1단계 요약 생성 실패:", chapterSummary);
      throw new Error("챕터 내용을 요약하는데 실패했습니다.");
    }
    
    console.log("생성된 요약:", chapterSummary); // 디버깅을 위해 요약 내용을 로그로 남긴다.

    // --- 2단계: 요약 기반 퀘스트 생성 요청 ---
    const questPrompt = `
      너는 사용자의 학습 목표 설정을 돕는 전문 가이드야.
      아래 '---'로 구분된 챕터 요약 내용을 바탕으로, 3가지 레벨의 학습 퀘스트를 생성해줘.

      - **레벨 1 (개념 분석):** 핵심 개념을 정의하거나 설명하는 질문.
      - **레벨 2 (실용 적용):** 개념을 실생활이나 개인적인 경험에 적용해보는 질문.
      - **레벨 3 (비판적 사고):** 개념의 한계, 반론, 또는 다른 아이디어와 연결하는 심화 질문.

      다른 설명은 모두 제외하고, 반드시 아래와 같은 JSON 배열 형식으로만 응답해줘.
      
      [
        { "level": 1, "type": "개념 분석", "text": "생성된 레벨 1 퀘스트 내용" },
        { "level": 2, "type": "실용 적용", "text": "생성된 레벨 2 퀘스트 내용" },
        { "level": 3, "type": "비판적 사고", "text": "생성된 레벨 3 퀘스트 내용" }
      ]
      
      ---
      ${chapterSummary}
      ---
    `;

    const questResult = await model.generateContent(questPrompt);
    const questResponse = await questResult.response;
    const questText = questResponse.text();

    let quests = [];
    try {
      const cleanedJson = questText.replace(/^```json\s*|```\s*$/g, "").trim();
      quests = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("AI 응답 JSON 파싱 실패:", parseError);
      console.error("파싱 전 원본 AI 응답:", questText);
      return { quests: [] }; // 파싱 실패 시 빈 배열 반환
    }

    return { quests: quests };

  } catch (error) {
    console.error("서버 함수 실행 중 오류 발생:", error.message);
    throw new onCall.HttpsError(
        "unknown",
        `AI 퀘스트 생성 중 오류 발생: ${error.message}`,
    );
  }
});