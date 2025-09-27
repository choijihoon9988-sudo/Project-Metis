// js/bookExplorer.js
import { UI } from './ui.js';
import { GoogleBooksAPI } from './api.js'; // 실제 API 모듈을 가져옵니다.

export const BookExplorer = {
    state: {},
    _boundHandleEvents: null,
    _boundHandleSearch: null,

    init() {
        this.state = { selectedBook: null };
        this._boundHandleEvents = this.handleEvents.bind(this);
        this._boundHandleSearch = this.handleSearch.bind(this);

        UI.BookExplorer.render('search');
        UI.BookExplorer.show();
        this.addEventListeners();
    },

    addEventListeners() {
        const content = document.getElementById('book-explorer-modal');
        content.removeEventListener('click', this._boundHandleEvents);
        content.removeEventListener('input', this._boundHandleSearch);
        content.addEventListener('input', this._boundHandleSearch);
        content.addEventListener('click', this._boundHandleEvents);
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
            this.state.selectedBook = {
                title: resultCard.dataset.title,
                author: resultCard.dataset.author,
                cover: resultCard.dataset.cover,
            };
            UI.BookExplorer.render('confirmation', this.state.selectedBook);
            return;
        }

        if (e.target.id === 'book-explorer-add-btn') {
            UI.BookExplorer.render('shelf-selection');
            return;
        }
        
        const shelfBtn = e.target.closest('.shelf-select-btn');
        if (shelfBtn) {
            const shelf = shelfBtn.dataset.shelf;
            document.dispatchEvent(new CustomEvent('addBookToLibrary', { 
                detail: { book: this.state.selectedBook, shelf: shelf }
            }));
            UI.BookExplorer.hide();
            return;
        }

        if (e.target.id === 'book-explorer-back-btn') {
            UI.BookExplorer.render('search');
            return;
        }

        if (e.target.id === 'book-explorer-select-main-btn') {
            document.dispatchEvent(new CustomEvent('bookSelected', { detail: this.state.selectedBook }));
            UI.BookExplorer.hide();
        }
    }
};