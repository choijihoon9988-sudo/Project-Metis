// js/bookExplorer.js
import { UI } from './ui.js';
import { GoogleBooksAPI } from './api.js'; // 실제 API 모듈을 가져옵니다.

export const BookExplorer = {
    state: {},

    init() {
        this.state = { selectedBook: null };
        UI.BookExplorer.render('search');
        UI.BookExplorer.show();
        this.addEventListeners();
    },

    addEventListeners() {
        const content = document.getElementById('book-explorer-modal');
        content.removeEventListener('click', this.handleEvents.bind(this));
        content.removeEventListener('input', this.handleSearch.bind(this));
        content.addEventListener('input', this.handleSearch.bind(this));
        content.addEventListener('click', this.handleEvents.bind(this));
    },

    // 검색 로직을 실제 API 호출로 변경합니다.
    async handleSearch(e) {
        if (e.target.id !== 'book-search-input') return;
        const query = e.target.value;
        if (query.trim().length < 2) return; // 최소 2글자 이상 입력 시 검색

        const results = await GoogleBooksAPI.searchBooks(query);
        UI.BookExplorer.render('results', { results });
    },

    handleEvents(e) {
        const resultCard = e.target.closest('.book-result-card');
        if (resultCard) {
            // API로부터 받은 데이터를 기반으로 선택된 책 정보를 구성합니다.
            this.state.selectedBook = {
                title: resultCard.dataset.title,
                author: resultCard.dataset.author,
                cover: resultCard.querySelector('img').src,
            };
            UI.BookExplorer.render('confirmation', this.state.selectedBook);
            return;
        }

        if (e.target.id === 'book-explorer-back-btn') {
            UI.BookExplorer.render('search');
            return;
        }

        if (e.target.id === 'book-explorer-confirm-btn') {
            document.dispatchEvent(new CustomEvent('bookSelected', { detail: this.state.selectedBook }));
            UI.BookExplorer.hide();
        }
    }
};

