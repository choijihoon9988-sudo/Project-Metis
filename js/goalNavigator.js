// js/goalNavigator.js (최종 수정본)

import { UI } from "./ui.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 💡 네가 준 API 키를 여기에 넣었어!
const API_KEY = "AIzaSyAGv3Zy6RpjhQ-fkxXxisXWuPYB24xQ94A"; 

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

        const prompt = `
          '${this.state.book.title}'라는 책의 '${this.state.chapterTitle}' 챕터(또는 소주제)의 핵심 내용을 바탕으로, 아래 3가지 레벨의 학습 퀘스트를 생성해줘.

          - **레벨 1 (개념 분석):** 핵심 개념을 정의하거나 설명하는 질문.
          - **레벨 2 (실용 적용):** 개념을 실생활이나 개인적인 경험에 적용해보는 질문.
          - **레벨 3 (비판적 사고):** 개념의 한계, 반론, 또는 다른 아이디어와 연결하는 심화 질문.

          다른 설명은 모두 제외하고, 반드시 아래와 같은 JSON 배열 형식으로만 응답해줘.
          
          [
            { "level": 1, "type": "개념 분석", "text": "생성된 레벨 1 퀘스트 내용" },
            { "level": 2, "type": "실용 적용", "text": "생성된 레벨 2 퀘스트 내용" },
            { "level": 3, "type": "비판적 사고", "text": "생성된 레벨 3 퀘스트 내용" }
          ]
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const cleanedJson = text.replace(/^```json\s*|```\s*$/g, "").trim();
            const quests = JSON.parse(cleanedJson);

            if (!quests || quests.length === 0) {
                 throw new Error("AI가 유효한 퀘스트를 생성하지 못했습니다.");
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
        // (이하 handleEvents 함수 내용은 기존과 동일)
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
            UI.GoalNavigator.render("chapterInput", { bookTitle: this.state.book.title });
            return;
        }

        if (e.target.id === "architect-confirm-goal") {
            this.state.selectedQuest.text = document.getElementById("architect-goal-editor").value;
            document.dispatchEvent(new CustomEvent("goalSelected", { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    },
};