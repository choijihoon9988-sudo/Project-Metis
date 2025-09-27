import { getReviewIntervalDays } from './utils.js';

// Renders the mission board on the main dashboard
function renderMissionBoard() {
    const stored = localStorage.getItem('knowledgePlants');
    const plants = stored ? JSON.parse(stored) : [];
    
    const now = new Date();
    now.setHours(0,0,0,0);

    const needyPlants = plants.filter(plant => {
        const lastReviewed = new Date(plant.reviews[plant.reviews.length-1].date);
        const interval = getReviewIntervalDays(plant.strength);
        const nextReviewDate = new Date(lastReviewed);
        nextReviewDate.setDate(lastReviewed.getDate() + interval);
        return now >= nextReviewDate;
    });

    const missionList = document.getElementById('mission-list');
    const missionCount = document.getElementById('mission-count');
    
    missionCount.textContent = needyPlants.length;
    if (needyPlants.length === 0) {
        missionList.innerHTML = `<p>오늘 관리할 지식이 없습니다. 완벽해요!</p>`;
        return;
    }

    missionList.innerHTML = needyPlants.map(p => `
        <div class="mission-item">
            <span>${p.title}</span>
            <small>${p.sourceBook}</small>
        </div>
    `).join('');
}

// Renders the synapse map (currently placeholder logic)
function renderSynapseMap() {
    document.getElementById('synapse-map-content').innerHTML = `
        <div class="suggestion">AI가 지식들을 분석하여 연결고리를 제안할 예정입니다.</div>
    `;
}

export function initializeDashboard() {
    renderMissionBoard();
    renderSynapseMap();
}