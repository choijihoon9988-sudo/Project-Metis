// js/goalNavigator.js (수정된 최종 코드)

import { UI } from "./ui.js";
// getFunctions와 app을 직접 가져오는 대신, firebase.js에서 만들어둔 functions를 가져옵니다.
import { functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

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
            // Firebase Cloud Function을 호출합니다. 함수 이름은 'generateQuestsForChapter'로 가정합니다.
            const generateQuestsForChapter = httpsCallable(functions, "generateQuestsForChapter");
            const result = await generateQuestsForChapter({ 
                bookTitle: this.state.book.title,
                chapterTitle: this.state.chapterTitle 
            });
            
            // 함수가 반환한 퀘스트 배열을 사용합니다.
            const quests = result.data.quests || [];
            if (quests.length === 0) {
                 throw new Error("AI가 퀘스트를 생성하지 못했습니다.");
            }
            
            UI.GoalNavigator.render("quests", { chapter: this.state.chapterTitle, quests });

        } catch (error) {
            console.error("AI 퀘스트 생성 실패:", error);
            UI.showToast("퀘스트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
            // 실패 시 다시 입력 화면으로 돌아갑니다.
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
        // '퀘스트 다시 선택' 버튼을 눌렀을 때, API를 다시 호출하지 않고
        // 이전에 생성된 퀘스트 목록을 보여주도록 수정할 수 있습니다. (추후 개선 사항)
        if (e.target.id === "goal-editor-back-btn") {
            // 현재는 간단하게 다시 생성하도록 처리합니다.
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