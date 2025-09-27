// js/goalNavigator.js (최종 수정본)

import { UI } from "./ui.js";
// 중앙 API 관리 모듈에서 Gemini 모델을 가져옵니다.
import { geminiModel } from './api.js';

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
            
            // 수정: API 호출 전에 모델 확인 로그 추가 (디버깅용)
            console.log("Gemini 모델 초기화 확인:", geminiModel);
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();  // 수정: trim() 추가로 공백 제거
            
            // AI 응답에 포함될 수 있는 마크다운 ```json
            if (text.startsWith("```json")) {
                text = text.slice(7, -3).trim();
            }

            const quests = JSON.parse(text);

            if (!quests || quests.length === 0) {
                 throw new Error("AI가 퀘스트를 생성하지 못했습니다.");
            }
            
            localStorage.setItem('lastQuests', JSON.stringify(quests)); // '뒤로가기'를 위해 결과 저장
            UI.GoalNavigator.render("quests", { chapter: this.state.chapterTitle, quests });

        } catch (error) {
            // 수정: 에러 핸들링 강화 - 콘솔에 상세 로그 출력
            console.error("AI 퀘스트 생성 실패 상세:", error.message, error.stack);
            UI.showToast("퀘스트 생성에 실패했습니다. 모델 이름('-latest' 제거 확인)이나 API 키를 확인하거나 잠시 후 다시 시도해주세요.", "error");
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
            const lastQuests = JSON.parse(localStorage.getItem('lastQuests')) || [];
            UI.GoalNavigator.render("quests", { chapter: this.state.chapterTitle, quests: lastQuests });
            return;
        }

        if (e.target.id === "architect-confirm-goal") {
            this.state.selectedQuest.text = document.getElementById("architect-goal-editor").value;
            document.dispatchEvent(new CustomEvent("goalSelected", { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    },
};