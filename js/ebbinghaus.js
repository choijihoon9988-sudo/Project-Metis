import { renderMissionBoard, renderCapsuleStorage, showChallengeModal, hideChallengeModal } from './ui.js';

let capsules = [];

// Spaced Repetition Interval (in days): 1, 3, 7, 16, 35...
const getReviewIntervalDays = (strength) => {
    if (strength <= 1) return 1;
    if (strength === 2) return 3;
    if (strength === 3) return 7;
    // After the third review, interval grows by a factor of ~2.1
    return Math.round(getReviewIntervalDays(strength - 1) * 2.1);
};

function loadCapsules() {
    const stored = localStorage.getItem('knowledgeCapsules');
    capsules = stored ? JSON.parse(stored) : [];
    
    // Ensure all capsules have a valid structure
    capsules.forEach(c => {
        if (!c.reviews) {
            c.reviews = [{ date: c.lastReviewed || new Date().toISOString(), confidence: 'confident' }];
        }
        calculateCapsuleState(c);
    });
}

function calculateCapsuleState(capsule) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Compare dates only

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

function startReview(capsule) {
    showChallengeModal(capsule, (confidence) => {
        capsule.reviews.push({ date: new Date().toISOString(), confidence });

        if (confidence === 'confident') {
            capsule.strength += 1;
        } else if (confidence === 'unsure') {
            // Strength remains the same
        } else { // 'guess'
            capsule.strength = Math.max(1, capsule.strength - 1); // Minimum strength is 1
        }
        
        const capsuleIndex = capsules.findIndex(c => c.id === capsule.id);
        if (capsuleIndex > -1) capsules[capsuleIndex] = capsule;
        
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        hideChallengeModal();
        
        // Refresh UI immediately
        initializeEbbinghaus(); 
    });
}

export function initializeEbbinghaus() {
    loadCapsules();
    const unlockedCapsules = capsules.filter(c => c.state === 'unlocked');
    renderMissionBoard(unlockedCapsules, startReview);
    renderCapsuleStorage(capsules, startReview);
}