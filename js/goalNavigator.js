// js/goalNavigator.js

import { UI } from "./ui.js";
import { functions } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";

const DUMMY_QUESTS = {
    "기준점 설정의 함정": [
        { level: 1, type: "개념 분석", text: "이 챕터의 핵심 개념인 '기준점 설정(Anchoring)'이 무엇인지, 책의 사례를 들어 3문장으로 설명하기" },
        { level: 2, type: "실용 적용", text: "최근 내가 경험한 쇼핑 상황에서 '기준점 설정'이 어떻게 활용되었는지 구체적인 사례를 찾아 분석하기" },
        { level: 3, type: "비판적 사고", text: "'기준점 설정'을 악용하여 소비자를 현혹하는 마케팅 사례를 찾고, 그에 대한 대응 방안을 제시하기" }
    ],
    "허구의 탄생": [
        { level: 1, type: "개념 분석", text: "'허구'가 사피엔스에게 어떤 결정적 이점을 주었는지 책의 내용을 바탕으로 요약하기" },
        { level: 2, type: "실용 적용", text: "현대 사회(예: 국가, 화폐, 법인)에서 작동하는 '허구'의 사례 3가지를 찾아 설명하기" },
        { level: 3, type: "비판적 사고", text: "저자의 주장처럼 '허구'가 인류 발전의 원동력이었다면, 그로 인한 가장 큰 부작용은 무엇이었을지 논하기" }
    ],
     "의미 있는 이름": [
        { level: 1, type: "개념 분석", text: "좋은 이름의 원칙(예: 의도를 밝혀라, 발음하기 쉬운 이름을 사용하라) 3가지를 요약하세요." },
        { level: 2, type: "실용 적용", text: "자신이 최근 작성한 코드에서 이름이 부적절하다고 생각되는 변수나 함수 3개를 찾아 더 나은 이름으로 리팩토링하세요." },
        { level: 3, type: "비판적 사고", text: "책에서 제안하는 명명 규칙이 모든 프로그래밍 언어나 프로젝트 환경에 항상 최선일까요? 예외적인 상황을 제시하고 그 이유를 설명하세요." }
    ]
};

export const GoalNavigator = {
    state: {},

    init(book) {
        this.state = { book, selectedChapter: null, selectedQuest: null };
        const content = document.getElementById("goal-navigator-modal");
        content.removeEventListener("click", this.handleEvents.bind(this));
        content.addEventListener("click", this.handleEvents.bind(this));
        this.renderTOC();
        UI.GoalNavigator.show();
    },

    async renderTOC() {
        UI.showLoader(true, "AI가 목차를 분석 중입니다...");

        try {
            // 서버의 getBookDetails 함수를 호출합니다. (이제 서울 리전에서 더 빠르게 응답합니다.)
            const getBookDetails = httpsCallable(functions, "getBookDetails");
            const result = await getBookDetails({ bookTitle: this.state.book.title });

            const toc = result.data.toc || [];
            UI.GoalNavigator.render("toc", { bookTitle: this.state.book.title, toc });
        } catch (error) {
            console.error("서버 함수 호출 중 오류 발생:", error);
            UI.showToast("AI 목차 분석에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
            UI.GoalNavigator.render("toc", { bookTitle: this.state.book.title, toc: [] });
        } finally {
            UI.showLoader(false);
        }
    },

    handleEvents(e) {
        const tocTitle = e.target.closest(".toc-title");
        if (tocTitle) {
            const chapters = tocTitle.nextElementSibling;
            const isOpening = chapters.style.display !== "block";
            chapters.style.display = isOpening ? "block" : "none";
            tocTitle.querySelector("span:last-child").textContent = isOpening ? "▲" : "▼";
            return;
        }

        const chapter = e.target.closest(".toc-chapter");
        if (chapter) {
            this.state.selectedChapter = chapter.textContent;
            // DUMMY_QUESTS에 목차에 없는 챕터가 있더라도 에러가 나지 않도록 기본값 []을 설정합니다.
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render("quests", { chapter: this.state.selectedChapter, quests });
            return;
        }

        const questCard = e.target.closest(".quest-card");
        if (questCard) {
            this.state.selectedQuest = { level: questCard.dataset.level, text: questCard.dataset.text };
            UI.GoalNavigator.render("editor", this.state.selectedQuest);
            return;
        }

        if (e.target.id === "goal-quests-back-btn") {
            this.renderTOC();
            return;
        }
        if (e.target.id === "goal-editor-back-btn") {
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render("quests", { chapter: this.state.selectedChapter, quests });
            return;
        }

        if (e.target.id === "architect-confirm-goal") {
            this.state.selectedQuest.text = document.getElementById("architect-goal-editor").value;
            document.dispatchEvent(new CustomEvent("goalSelected", { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    },
};