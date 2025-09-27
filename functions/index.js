const functions = require("firebase-functions");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// [오류 수정] process.env.GEMINI_KEY 로 환경 변수에서 API 키를 안전하게 로드합니다.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

exports.generateQuestsForChapter = functions.https.onCall(async (data, context) => {
  const {bookTitle, chapterTitle} = data;

  if (!bookTitle || !chapterTitle) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "책 제목과 챕터 제목은 필수입니다.",
    );
  }

  const model = genAI.getGenerativeModel({model: "gemini-pro"});

  const prompt = `
        당신은 유능한 학습 설계 전문가입니다. 
        다음 정보를 바탕으로 사용자를 위한 3가지 레벨의 학습 목표(퀘스트)를 
        생성해주세요. 각 퀘스트는 구체적이고 실행 가능한 형태로 제안해야 합니다.

        - 책 제목: "${bookTitle}"
        - 학습할 챕터 또는 소주제: "${chapterTitle}"

        퀘스트 레벨 정의:
        - 레벨 1 (핵심 개념): 이 챕터의 가장 기본적인 구성 요소(용어, 개념, 원리) 
          하나를 명확히 이해하고 설명하는 것을 목표로 합니다.
        - 레벨 2 (주제 묶음): 여러 핵심 개념들을 엮어서, 이 챕터가 말하려는 
          하나의 완성된 주장이나 프로세스를 다른 사람에게 설명할 수 있는 수준을 
          목표로 합니다. 가장 이상적인 목표입니다.
        - 레벨 3 (저자의 관점): 이 챕터의 주장을 책 전체의 맥락과 연결하거나, 
          주장에 대한 비판적 시각(반론, 한계점)을 제시하는 것을 목표로 합니다.

        출력 형식은 반드시 다음 JSON 형식의 배열이어야 합니다. 
        다른 설명은 절대 추가하지 마세요:
        [
            { "level": 1, "type": "개념 정의", "text": "생성된 레벨 1 퀘스트 내용" },
            { "level": 2, "type": "연결 설명", "text": "생성된 레벨 2 퀘스트 내용" },
            { "level": 3, "type": "관점 확장", "text": "생성된 레벨 3 퀘스트 내용" }
        ]
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const quests = JSON.parse(text);
    return {quests};
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    throw new functions.https.HttpsError(
        "internal",
        "AI 퀘스트 생성에 실패했습니다.",
    );
  }
});