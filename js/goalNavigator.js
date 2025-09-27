// js/goalNavigator.js
// 'AI 목표 내비게이터'의 3단계 상호작용 로직을 관리합니다.

import { UI } from './ui.js';

// 가상 목차 및 퀘스트 데이터
const DUMMY_TOC = {
    "넛지 (Nudge)": [
        { part: "1부: 인간은 왜 실수를 반복하는가?", chapters: ["기준점 설정의 함정", "손실 회피 편향"] },
        { part: "2부: 더 나은 선택을 이끄는 힘, 넛지", chapters: ["디폴트", "피드백과 오류 예상"] }
    ],
    "사피엔스": [
        { part: "1부: 인지 혁명", chapters: ["허구의 탄생", "수다쟁이 유인원"] },
        { part: "4부: 과학 혁명", chapters: ["무지의 발견", "자본주의 교리"] }
    ],
     "클린 코드": [
        { part: "1부: 클린 코드", chapters: ["의미 있는 이름", "함수"] },
        { part: "2부: 클린 코드 실천", chapters: ["클래스", "오류 처리"] }
    ],
    "역행자": [ // '역행자' 목차 추가
        { part: "1부: 자의식 해체", chapters: ["탐색", "인정", "전환"] },
        { part: "2부: 정체성 만들기", chapters: ["뇌 자동화", "역행자의 지식"] }
    ]
};

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

    init(book) { // book 객체 전체를 받도록 수정
        this.state = { book, selectedChapter: null, selectedQuest: null };
        const content = document.getElementById('goal-navigator-modal');
        content.removeEventListener('click', this.handleEvents.bind(this));
        content.addEventListener('click', this.handleEvents.bind(this));

        this.renderTOC();
        UI.GoalNavigator.show();
    },

    // 목차 렌더링 로직 수정
    async renderTOC() {
        // Google Books API는 공식적인 목차 정보를 제공하지 않으므로,
        // 미리 정의된 DUMMY_TOC를 우선적으로 사용합니다.
        const toc = DUMMY_TOC[this.state.book.title] || DUMMY_TOC[this.state.book.title.split(':')[0].trim()] || [];

        UI.GoalNavigator.render('toc', { bookTitle: this.state.book.title, toc });
    },

    handleEvents(e) {
        // 토글(아코디언) 기능
        const tocTitle = e.target.closest('.toc-title');
        if (tocTitle) {
            const chapters = tocTitle.nextElementSibling;
            const isOpening = chapters.style.display !== 'block';
            chapters.style.display = isOpening ? 'block' : 'none';
            tocTitle.querySelector('span:last-child').textContent = isOpening ? '▲' : '▼';
            return;
        }

        // 챕터 선택
        const chapter = e.target.closest('.toc-chapter');
        if (chapter) {
            this.state.selectedChapter = chapter.textContent;
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render('quests', { chapter: this.state.selectedChapter, quests });
            return;
        }

        // 퀘스트 선택
        const questCard = e.target.closest('.quest-card');
        if (questCard) {
            this.state.selectedQuest = { level: questCard.dataset.level, text: questCard.dataset.text };
            UI.GoalNavigator.render('editor', this.state.selectedQuest);
            return;
        }

        // 뒤로가기 버튼들
        if (e.target.id === 'goal-quests-back-btn') {
            this.renderTOC();
            return;
        }
        if (e.target.id === 'goal-editor-back-btn') {
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render('quests', { chapter: this.state.selectedChapter, quests });
            return;
        }

        // 최종 목표 확정
        if (e.target.id === 'architect-confirm-goal') {
            this.state.selectedQuest.text = document.getElementById('architect-goal-editor').value;
            document.dispatchEvent(new CustomEvent('goalSelected', { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    }
};