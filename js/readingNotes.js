import { renderReadingNotes } from './ui.js';

let notes = [];
// A default list of books, can be expanded dynamically.
let books = ["넛지 (Nudge)", "역행자", "클루지", "설득의 심리학"];

function loadNotes() {
    const storedNotes = localStorage.getItem('readingNotes');
    notes = storedNotes ? JSON.parse(storedNotes) : [];
    
    // Add default notes if empty, for demonstration
    if (notes.length === 0) {
        notes = [
            { id: '1', book: '넛지 (Nudge)', content: '사람들은 기본 설정 값을 바꾸지 않으려는 경향(디폴트)이 있다. 이걸 이용해 긍정적 행동을 유도할 수 있다.', highlighted: true, createdAt: new Date().toISOString() },
            { id: '2', book: '넛지 (Nudge)', content: '선택 설계는 결코 중립적일 수 없다.', highlighted: false, createdAt: new Date().toISOString() },
        ];
        saveNotes();
    }
}

function saveNotes() {
    localStorage.setItem('readingNotes', JSON.stringify(notes));
}

function getUniqueBooks() {
    const bookSet = new Set(books);
    notes.forEach(note => bookSet.add(note.book));
    return Array.from(bookSet).sort();
}

function addNote() {
    const contentInput = document.getElementById('new-note-input');
    const bookSelect = document.getElementById('note-book-select');
    const content = contentInput.value;
    const book = bookSelect.value;

    if (!content.trim() || !book) {
        alert('책을 선택하고 내용을 입력해주세요.');
        return;
    }

    const newNote = {
        id: Date.now().toString(),
        book: book,
        content: content,
        highlighted: false,
        createdAt: new Date().toISOString()
    };

    notes.unshift(newNote); // Add to the top
    saveNotes();
    contentInput.value = '';
    refreshUI();
}

function deleteNote(id) {
    if (confirm("정말로 이 노트를 삭제하시겠습니까?")) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        refreshUI();
    }
}

function toggleHighlight(id) {
    const note = notes.find(note => note.id === id);
    if (note) {
        note.highlighted = !note.highlighted;
        saveNotes();
        refreshUI();
    }
}

function startSessionFromNote(id) {
    const note = notes.find(note => note.id === id);
    if (note) {
        const event = new CustomEvent('startSessionFromNote', { detail: { note } });
        document.dispatchEvent(event);
    }
}

const eventHandlers = {
    delete: deleteNote,
    highlight: toggleHighlight,
    startSession: startSessionFromNote
};

function refreshUI() {
    renderReadingNotes(getUniqueBooks(), notes, eventHandlers);
}

export function initializeReadingNotes() {
    loadNotes();
    document.getElementById('add-note-btn').onclick = addNote;
    document.getElementById('note-book-select').onchange = refreshUI;
    refreshUI();
}   