// js/goalNavigator.js (수정된 최종 코드)

import { UI } from "./ui.js";
// Firebase Functions 대신 Gemini AI 라이브러리를 직접 가져옵니다.
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚨 중요: 이 API 키는 웹사이트에 노출됩니다. 개인적인 테스트 용도로만 사용하세요.
const GEMINI_API_KEY = "AIzaSyAf6ORBoBpWBMEMWM0xyh31YGR-5jWwTqA";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const GoalNavigator = {
    state: {},

    init(book) {
        this.state = { book, selectedQuest: null };
        const content = document.getElementById("goal-navigator-modal");
        content.removeEventListener("click", this.handleEvents.bind(this));
        content.addEventListener("click", this.handleEvents.bind(this));
        UI.GoalNavigator.render("chapterInput", { bookTitle: this.state.book.title });
        UI.GoalNavigator.show();
    },

    async generateQuests() {
        const chapterTitle = document.getElementById('chapter-input').value;
        if (!chapterTitle.trim()) {
            UI.showToast("학습할 챕터의 제목을 입력해주세요.", "error");
            return;
        }
        
        this.state.chapterTitle = chapterTitle;
        UI.showLoader(true, "AI가 챕터를 분석하고 퀘스트를 생성 중입니다...");

        try {
            // 서버 호출 대신 클라이언트에서 직접 Gemini API를 호출합니다.
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                당신은 유능한 학습 설계 전문가입니다. 
                다음 정보를 바탕으로 사용자를 위한 3가지 레벨의 학습 목표(퀘스트)를 
                생성해주세요. 각 퀘스트는 구체적이고 실행 가능한 형태로 제안해야 합니다.

                - 책 제목: "${this.state.book.title}"
                - 학습할 챕터 또는 소주제: "${this.state.chapterTitle}"

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
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // AI가 생성한 텍스트를 JSON으로 파싱합니다.
            const quests = JSON.parse(text);

            if (!quests || quests.length === 0) {
                 throw new Error("AI가 퀘스트를 생성하지 못했습니다.");
            }
            
            UI.GoalNavigator.render("quests", { chapter: this.state.chapterTitle, quests });

        } catch (error) {
            console.error("AI 퀘스트 생성 실패:", error);
            UI.showToast("퀘스트 생성에 실패했습니다. API 키를 확인하거나 잠시 후 다시 시도해주세요.", "error");
            UI.GoalNavigator.render("chapterInput", { bookTitle: this.state.book.title });
        } finally {
            UI.showLoader(false);
        }
    },

    handleEvents(e) {
        if (e.target.id === 'generate-quests-btn') {
            this.generateQuests();
            return;
        }

        const questCard = e.target.closest(".quest-card");
        if (questCard) {
            this.state.selectedQuest = { 
                level: questCard.dataset.level, 
                text: questCard.dataset.text.trim() 
            };
            UI.GoalNavigator.render("editor", this.state.selectedQuest);
            return;
        }

        if (e.target.id === "goal-quests-back-btn") {
            UI.GoalNavigator.render("chapterInput", { bookTitle: this.state.book.title });
            return;
        }
        if (e.target.id === "goal-editor-back-btn") {
            this.generateQuests(); 
            return;
        }

        if (e.target.id === "architect-confirm-goal") {
            this.state.selectedQuest.text = document.getElementById("architect-goal-editor").value;
            document.dispatchEvent(new CustomEvent("goalSelected", { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    },
};