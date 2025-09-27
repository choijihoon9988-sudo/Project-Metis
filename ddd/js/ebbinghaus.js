// js/ebbinghaus.js
// 이 모듈은 '지식 정원'의 모든 데이터를 관리하고, 망각곡선 이론에 따라 핵심 로직을 담당합니다.

// ui.js에서 UI 객체를 가져와야 그 안의 함수를 사용할 수 있습니다.
import { UI } from './ui.js';

const STORAGE_KEY = 'metisPlants';

export const Ebbinghaus = {
    plants: [],

    getReviewInterval(strength) {
        if (strength <= 1) return 1;
        if (strength === 2) return 3;
        if (strength === 3) return 7;
        return Math.round(this.getReviewInterval(strength - 1) * 1.8);
    },

    load() {
        this.plants = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        this.plants.forEach(p => this.updatePlantState(p));
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plants));
    },

    updatePlantState(plant) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const lastReviewed = new Date(plant.reviews[plant.reviews.length - 1].date);
        const interval = this.getReviewInterval(plant.strength);

        const nextReviewDate = new Date(lastReviewed);
        nextReviewDate.setDate(lastReviewed.getDate() + interval);
        plant.nextReviewDate = nextReviewDate.toISOString();

        const diffDays = Math.ceil((nextReviewDate - now) / (1000 * 60 * 60 * 24));
        plant.daysUntilReview = diffDays;

        if (diffDays <= 0) plant.status = 'urgent';
        else if (diffDays <= 3) plant.status = 'needs-care';
        else plant.status = 'healthy';

        if (plant.strength <= 2) plant.memoryStage = '단기 기억';
        else if (plant.strength <= 4) plant.memoryStage = '장기 기억 전환 중';
        else plant.memoryStage = '장기 기억';
    },

    plantSeed(sessionData) {
        const goal = document.querySelector('#main-book-goal p').textContent;
        const sourceBook = document.getElementById('main-book-title').textContent;
        const { gap, finalWriting } = sessionData;

        const newPlant = {
            id: Date.now(),
            title: goal,
            sourceBook: sourceBook,
            question: `[핵심 질문] ${gap || '정의된 질문 없음'}\n\n당신이 체화한 지식:`,
            answer: finalWriting,
            strength: 1,
            reviews: [{ date: new Date().toISOString() }]
        };

        this.plants.push(newPlant);
        this.save();
        this.initGarden(); // 정원을 다시 로드하고 화면을 갱신
    },

    /**
     * 지식 정원을 초기화하고 화면에 렌더링을 요청합니다.
     */
    initGarden() {
        this.load();
        // *** 여기가 핵심 변경 사항입니다! ***
        // 콘솔에만 찍던 데이터를 이제 UI.renderGarden 함수에 전달하여 화면에 그리도록 합니다.
        UI.renderGarden(this.plants);
    },

    getPlantById(id) {
        return this.plants.find(p => p.id == id);
    },
};

