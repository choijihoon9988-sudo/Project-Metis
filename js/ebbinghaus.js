import { renderCapsuleStorage, showChallengeModal, hideChallengeModal } from './ui.js';

let capsules = [];

const getReviewIntervalDays = (strength) => {
    if (strength <= 1) return 1;
    if (strength === 2) return 3;
    if (strength === 3) return 7;
    return Math.round(getReviewIntervalDays(strength - 1) * 2.1);
};

function loadCapsules() {
    const stored = localStorage.getItem('knowledgeCapsules');
    capsules = stored ? JSON.parse(stored) : [];
    capsules.forEach(c => {
        if (!c.reviews) {
            c.reviews = [{ date: new Date().toISOString(), confidence: 'confident' }];
        }
        calculateCapsuleState(c);
    });
}

function calculateCapsuleState(capsule) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const lastReviewed = new Date(capsule.reviews[capsule.reviews.length - 1].date);
    const interval = getReviewIntervalDays(capsule.strength);
    
    const nextReviewDate = new Date(lastReviewed);
    nextReviewDate.setDate(lastReviewed.getDate() + interval);
    nextReviewDate.setHours(0, 0, 0, 0);

    capsule.nextReviewDate = nextReviewDate.toISOString();

    if (now >= nextReviewDate) {
        capsule.state = 'unlocked';
    } else {
        capsule.state = 'locked';
        const diffTime = Math.abs(nextReviewDate - now);
        capsule.daysUntilUnlock = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

export function startReview(capsuleId) {
    const capsule = capsules.find(c => c.id == capsuleId);
    if (!capsule) return;

    showChallengeModal(capsule, (confidence) => {
        capsule.reviews.push({ date: new Date().toISOString(), confidence });

        if (confidence === 'confident') {
            capsule.strength += 1;
        } else if (confidence === 'unsure') {
            // Strength remains the same
        } else {
            capsule.strength = Math.max(1, capsule.strength - 1);
        }
        
        const capsuleIndex = capsules.findIndex(c => c.id === capsule.id);
        if (capsuleIndex > -1) capsules[capsuleIndex] = capsule;
        
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        hideChallengeModal();
        
        // 현재 필터 상태를 유지하며 UI 새로고침
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        initializeEbbinghaus(activeFilter); 
    });
}

export function initializeEbbinghaus(filter = 'unlocked') {
    loadCapsules();
    
    let filteredCapsules = [];
    if (filter === 'all') {
        filteredCapsules = capsules;
    } else {
        filteredCapsules = capsules.filter(c => c.state === filter);
    }
    renderCapsuleStorage(filteredCapsules, filter);
}

