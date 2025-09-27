// js/bookExplorer.js
// 'AI 도서 탐색기'의 모든 상호작용과 로직을 관리합니다.

import { UI } from './ui.js';

// Google Books API를 대신할 가상 데이터
const DUMMY_BOOKS = {
    "넛지": { title: "넛지 (Nudge)", author: "리처드 H. 탈러, 캐스 R. 선스타인", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1593003033l/54495910.jpg" },
    "사피엔스": { title: "사피엔스", author: "유발 하라리", cover: "https://image.aladin.co.kr/product/30883/29/cover500/k252830635_1.jpg" },
    "클린 코드": { title: "클린 코드", author: "로버트 C. 마틴", cover: "https://image.aladin.co.kr/product/1324/3/cover500/890120935x_1.jpg" }
};

export const BookExplorer = {
    state: {}, // 선택된 책 정보를 저장

    init() {
        this.state = { selectedBook: null };
        UI.BookExplorer.render('search'); // UI에 검색창 렌더링 요청
        UI.BookExplorer.show(); // UI에 모달 표시 요청
        this.addEventListeners();
    },

    // 모달 내의 이벤트만 수신하도록 리스너를 추가/제거
    addEventListeners() {
        const content = document.getElementById('book-explorer-modal');
        content.removeEventListener('click', this.handleEvents.bind(this));
        content.removeEventListener('input', this.handleSearch.bind(this));

        content.addEventListener('input', this.handleSearch.bind(this));
        content.addEventListener('click', this.handleEvents.bind(this));
    },

    // 검색창 입력에 반응
    handleSearch(e) {
        if (e.target.id !== 'book-search-input') return;
        const query = e.target.value.toLowerCase();
        const results = Object.keys(DUMMY_BOOKS)
            .filter(key => key.toLowerCase().includes(query))
            .map(key => DUMMY_BOOKS[key]);
        UI.BookExplorer.render('results', { results }); // UI에 결과 렌더링 요청
    },

    // 모달 내 클릭 이벤트 처리
    handleEvents(e) {
        // 책 선택 시
        const resultCard = e.target.closest('.book-result-card');
        if (resultCard) {
            const title = resultCard.dataset.title;
            const titleKey = Object.keys(DUMMY_BOOKS).find(key => DUMMY_BOOKS[key].title === title);
            this.state.selectedBook = DUMMY_BOOKS[titleKey];
            UI.BookExplorer.render('confirmation', this.state.selectedBook); // UI에 확인창 렌더링 요청
            return;
        }

        // '뒤로가기' 버튼 클릭 시
        if (e.target.id === 'book-explorer-back-btn') {
            UI.BookExplorer.render('search');
            return;
        }

        // 최종 '확인' 버튼 클릭 시
        if (e.target.id === 'book-explorer-confirm-btn') {
            // 'bookSelected'라는 커스텀 이벤트를 발생시켜 main.js에 알림
            document.dispatchEvent(new CustomEvent('bookSelected', { detail: this.state.selectedBook }));
            UI.BookExplorer.hide();
        }
    }
};
