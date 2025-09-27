// js/refinement.js
import { db } from './firebase.js';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { Ebbinghaus } from './ebbinghaus.js';
import { UI } from './ui.js';

export const Refinement = {
    refinements: [],
    userId: null,

    setUser(userId) {
        this.userId = userId;
    },

    async startRefinement(clippings, book) {
        if (!this.userId || clippings.length === 0) return;
        
        const now = new Date();
        const unlockTime = new Date(now);
        unlockTime.setDate(now.getDate() + 1); // 24시간 후 잠금 해제

        const newRefinement = {
            id: String(Date.now()),
            bookTitle: book.title,
            bookCover: book.cover,
            stage: 1,
            clippings: clippings.map((text, index) => ({ id: index, text, highlighted: false, note: '' })),
            createdAt: now.toISOString(),
            unlocksAt: unlockTime.toISOString(),
        };

        const refinementRef = doc(db, 'users', this.userId, 'refinements', newRefinement.id);
        await setDoc(refinementRef, newRefinement);
        this.refinements.push(newRefinement);
        UI.Dashboard.renderRefinements(this.refinements);
    },

    async load() {
        if (!this.userId) return;
        const refinementsCol = collection(db, 'users', this.userId, 'refinements');
        const snapshot = await getDocs(refinementsCol);
        this.refinements = snapshot.docs.map(doc => doc.data());
        UI.Dashboard.renderRefinements(this.refinements);
    },

    async update(refinementId, updatedClippings) {
        if (!this.userId) return;
        const refinement = this.refinements.find(r => r.id === refinementId);
        if (!refinement) return;
        
        const now = new Date();
        let nextUnlockDate = new Date(now);

        if (refinement.stage === 1) { // 하이라이팅 완료
            refinement.stage = 2;
            nextUnlockDate.setDate(now.getDate() + 6); // 7일차
        } else if (refinement.stage === 2) { // 생각 연결 완료
            refinement.stage = 3;
            nextUnlockDate.setDate(now.getDate() + 23); // 30일차
        }
        
        refinement.clippings = updatedClippings;
        refinement.unlocksAt = nextUnlockDate.toISOString();

        const refinementRef = doc(db, 'users', this.userId, 'refinements', refinementId);
        await updateDoc(refinementRef, {
            stage: refinement.stage,
            clippings: refinement.clippings,
            unlocksAt: refinement.unlocksAt,
        });

        UI.Dashboard.renderRefinements(this.refinements);
    },

    async finalize(refinementId, selectedClippingIds) {
        if (!this.userId) return;
        const refinement = this.refinements.find(r => r.id === refinementId);
        if (!refinement) return;

        const selectedClippings = refinement.clippings.filter(c => selectedClippingIds.includes(String(c.id)));

        for (const clip of selectedClippings) {
            const sessionData = {
                gap: clip.text, // 하이라이트를 핵심 질문으로
                finalWriting: clip.note, // 내 생각을 체화 글로
            };
            // Ebbinghaus 모듈을 사용하여 정원에 씨앗 심기
            await Ebbinghaus.plantSeed(sessionData, {title: refinement.bookTitle});
        }
        
        // 정제 데이터 삭제
        const refinementRef = doc(db, 'users', this.userId, 'refinements', refinementId);
        await deleteDoc(refinementRef);

        this.refinements = this.refinements.filter(r => r.id !== refinementId);
        await Ebbinghaus.initGarden();
        UI.Dashboard.renderRefinements(this.refinements);
        UI.showToast(`${selectedClippings.length}개의 지식 씨앗을 정원에 심었습니다!`, 'success');
    },
    
    getById(id) {
        return this.refinements.find(r => r.id === id);
    }
};