// functions/index.js

const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { VertexAI, HarmCategory, HarmBlockThreshold } = require("@google-cloud/vertexai");

// 모든 함수의 기본 지역을 서울로 설정
setGlobalOptions({ region: "asia-northeast3" });

// Vertex AI 클라이언트 초기화 (인증 부분은 동일)
const vertexAI = new VertexAI({
    project: process.env.GCLOUD_PROJECT,
    location: "asia-northeast3",
});

// AI 모델 설정 (Tool 기능은 모델 생성 시가 아닌, 요청 시에 직접 전달)
const questGenerationModel = vertexAI.getGenerativeModel({
    model: "gemini-1.5-flash-001", // 최신이고 더 빠른 모델로 변경
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
});

// 1. AI에게 'google_search' 도구를 정의 (이 부분은 수정 없음)
const googleSearchTool = {
    functionDeclarations: [
        {
            name: "google_search",
            description: "책 제목과 챕터(소주제)를 이용해 구글에서 관련 내용을 검색하고, 그 결과를 텍스트로 반환합니다.",
            parameters: {
                type: "OBJECT",
                properties: {
                    query: {
                        type: "STRING",
                        description: "검색할 쿼리. 책 제목과 챕터 제목을 포함해야 합니다."
                    }
                },
                required: ["query"]
            }
        }
    ]
};

exports.generateQuestsForChapter = onCall(async (request) => {
    const { bookTitle, chapterTitle } = request.data;
    if (!bookTitle || !chapterTitle) {
        throw new onCall.HttpsError("invalid-argument", "책 제목과 챕터 제목이 필요합니다.");
    }

    try {
        // 2. AI에게 대화를 시작하며 도구를 전달
        const chat = questGenerationModel.startChat({
            tools: [googleSearchTool],
        });

        const prompt = `
            '${bookTitle}' 책의 '${chapterTitle}' 챕터에 대한 학습 퀘스트 3개를 생성해줘.
            
            먼저 google_search 도구를 사용해서 해당 챕터의 핵심 내용을 딱 1~2개만 검색해서 그 내용을 완벽히 이해해야 해.
            
            그 다음, 이해한 내용을 바탕으로 아래 3가지 레벨의 퀘스트를 생성해줘.
            - 레벨 1 (개념 분석): 핵심 개념 정의 또는 설명
            - 레벨 2 (실용 적용): 개념을 실생활/경험에 적용
            - 레벨 3 (비판적 사고): 개념의 한계, 반론, 심화 질문

            다른 설명은 모두 제외하고, 반드시 아래 JSON 형식으로만 응답해줘.
            [
              { "level": 1, "type": "개념 분석", "text": "..." },
              { "level": 2, "type": "실용 적용", "text": "..." },
              { "level": 3, "type": "비판적 사고", "text": "..." }
            ]
        `;
        
        const result = await chat.sendMessage(prompt);
        const response = result.response;

        // 3. AI 응답에서 텍스트 부분만 정확히 추출
        const text = response.candidates[0].content.parts[0].text;
        
        if (!text) {
             console.error("AI가 텍스트를 반환하지 않았습니다.", response);
             return { quests: [] };
        }
        
        let quests = [];
        try {
            // AI 응답 앞뒤에 붙는 마크다운 코드 블록 제거
            const cleanedJson = text.replace(/^```json\s*|```\s*$/g, "").trim();
            quests = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.error("AI 응답 JSON 파싱 실패:", parseError, "원본 응답:", text);
            return { quests: [] }; // 파싱 실패 시 빈 배열 반환
        }
        
        console.log("[퀘스트 생성 완료]", quests);
        return { quests };

    } catch (error) {
        console.error("서버 함수 실행 중 오류 발생:", error);
        throw new onCall.HttpsError("unknown", `AI 퀘스트 생성 중 오류가 발생했습니다.`);
    }
});