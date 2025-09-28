// js/library.js (신규 파일)
import { db } from './firebase.js';
import { collection, doc, getDocs, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { UI } from './ui.js';
import { geminiModel, geminiTextModel } from './api.js';

export const Library = {
    books: [],
    skills: {},
    userId: null,

    setUser(userId) {
        this.userId = userId;
    },

    async load() {
        if (!this.userId) return;

        // =================================================================
        // 지식의 고도 테스트용 코드 블록을 삭제합니다.
        // =================================================================

        const booksCol = collection(db, 'users', this.userId, 'library');
        const snapshot = await getDocs(booksCol);
        this.books = snapshot.docs.map(doc => doc.data());

        const skillsDocRef = doc(db, 'users', this.userId, 'skills', 'summary');
        const skillsSnapshot = await getDoc(skillsDocRef);
        if (skillsSnapshot.exists()) {
            this.skills = skillsSnapshot.data();
        }

        UI.Library.render(this.books, this.skills);

        // 뷰가 완전히 렌더링 된 후 스크롤 계산을 위해 약간의 지연을 줍니다.
        setTimeout(() => {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                 UI.Library.handleAltitudeScrollEffects({ target: mainContent });
            }
        }, 100);
    },

    async addBook(book, shelf) {
        if (!this.userId) return;

        UI.showLoader(true, 'AI가 책을 분석하고 서재에 추가하는 중...');

        const newBook = {
            id: String(Date.now()),
            ...book,
            shelf: shelf,
            category: await this.getAIBookCategory(book.title),
            skillFocus: await this.getAISkillFocus(book.title),
            finishedAt: shelf === 'finished' ? new Date().toISOString() : null
        };

        const bookRef = doc(db, 'users', this.userId, 'library', newBook.id);
        await setDoc(bookRef, newBook);
        this.books.push(newBook);

        UI.showLoader(false);
        UI.showToast(`'${book.title}'을(를) '${shelf}' 선반에 추가했습니다.`, 'success');
        UI.Library.render(this.books, this.skills);
    },

    async showBookDetail(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        UI.showLoader(true, 'AI가 책의 상세 정보를 분석 중입니다...');

        const relatedBookRec = await this.getAIRelatedBookRecommendation(book, this.books);

        UI.showLoader(false);
        UI.Library.renderBookDetail(book, this.skills, relatedBookRec);
        UI.Library.show();
    },

    // --- AI Helper Functions ---
    async getAIBookCategory(title) {
        const prompt = `'${title}' 책의 핵심 카테고리를 '자기계발', '심리학', '뇌과학', '인문', '경제/경영', '기술' 중에서 하나만 골라주세요. 다른 설명 없이 카테고리 이름만 정확히 출력해주세요.`;
        try {
            const result = await geminiTextModel.generateContent(prompt);
            return (await result.response).text().trim();
        } catch (e) { return '미분류'; }
    },

    async getAISkillFocus(title) {
        const prompt = `'${title}' 책을 읽으면 얻게 되는 가장 핵심적인 스킬 또는 역량을 "이 책을 통해 [스킬]을 얻게 됩니다." 형식의 한 문장으로 요약해주세요.`;
        try {
            const result = await geminiTextModel.generateContent(prompt);
            return (await result.response).text().trim();
        } catch (e) { return '핵심 스킬을 분석할 수 없습니다.'; }
    },

    async getAIRelatedBookRecommendation(currentBook, libraryBooks) {
        const otherBooks = libraryBooks.filter(b => b.id !== currentBook.id && b.shelf === 'finished').map(b => b.title).join(', ');
        if (!otherBooks) return "서재에 비교할 만한 다른 책이 없습니다.";

        const prompt = `현재 사용자가 '${currentBook.title}' 책의 정보를 보고 있습니다. 이 사용자는 과거에 '${otherBooks}' 책들을 읽었습니다. 
        '${currentBook.title}' 책이 이전에 읽은 책들과 어떻게 연관되는지, 어떤 점이 유사하고 어떤 차이점이 있는지 흥미롭게 한두 문장으로 설명해주세요.`;
        try {
            const result = await geminiTextModel.generateContent(prompt);
            return (await result.response).text().trim();
        } catch(e) { return "연관 도서를 분석할 수 없습니다."; }
    }
};