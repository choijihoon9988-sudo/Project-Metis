// js/goalNavigator.js

import { UI } from "./ui.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { app } from "./firebase.js";

const functions = getFunctions(app, 'asia-northeast3');

export const GoalNavigator = {
    state: {},

    init(book) {
        this.state = { book, selectedQuest: null };
        const content = document.getElementById("goal-navigator-modal");
        content.removeEventListener("click", this.handleEvents.bind(this));
        content.addEventListener("click", this.handleEvents.bind(this));
        // 초기 화면을 '챕터 입력' 창으로 변경
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
            // 새로운 서버 함수 호출
            const generateQuestsForChapter = httpsCallable(functions, "generateQuestsForChapter");
            const result = await generateQuestsForChapter({ 
                bookTitle: this.state.book.title,
                chapterTitle: this.state.chapterTitle 
            });
            
            const quests = result.data.quests || [];
            if (quests.length === 0) {
                 throw new Error("AI가 퀘스트를 생성하지 못했습니다.");
            }
            
            UI.GoalNavigator.render("quests", { chapter: this.state.chapterTitle, quests });

        } catch (error) {
            console.error("AI 퀘스트 생성 실패:", error);
            UI.showToast("퀘스트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
            // 실패 시에도 챕터 입력창을 다시 보여줌
            UI.GoalNavigator.render("chapterInput", { bookTitle: this.state.book.title });
        } finally {
            UI.showLoader(false);
        }
    },

    handleEvents(e) {
        // '퀘스트 생성' 버튼 클릭
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
            // 이 부분은 quests 정보가 state에 없으므로 다시 생성 요청
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