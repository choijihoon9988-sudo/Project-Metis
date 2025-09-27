import { renderCapsuleStorage, showChallengeModal, hideChallengeModal } from './ui.js';

let capsules = [];
let currentFilter = 'unlocked'; // 기본 필터는 '오늘의 복습'

// 망각곡선에 따른 복습 주기 (일 단위): 1일, 3일, 7일, 16일, 35일...
const getReviewIntervalDays = (strength) => {
    if (strength <= 1) return 1; // 1차 복습: 1일 후
    if (strength === 2) return 3; // 2차 복습: 3일 후
    if (strength === 3) return 7; // 3차 복습: 7일 후
    // 그 이후는 약 2.1배씩 증가 (장기기억화)
    return Math.round(getReviewIntervalDays(strength - 1) * 2.1);
};

function loadCapsules() {
    const stored = localStorage.getItem('knowledgeCapsules');
    capsules = stored ? JSON.parse(stored) : [];
    
    // 모든 캡슐의 상태 (잠금/해제) 계산
    capsules.forEach(c => {
        // 데이터 구조 보정 (과거 데이터 호환용)
        if (!c.reviews) {
            c.reviews = [{ date: new Date().toISOString(), confidence: 'confident' }];
        }
        calculateCapsuleState(c);
    });
}

// 각 캡슐의 다음 복습일을 계산하고 상태를 결정하는 함수
function calculateCapsuleState(capsule) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 날짜만 비교하기 위해 시간 초기화

    const lastReviewed = new Date(capsule.reviews[capsule.reviews.length - 1].date);
    const interval = getReviewIntervalDays(capsule.strength);
    
    const nextReviewDate = new Date(lastReviewed);
    nextReviewDate.setDate(lastReviewed.getDate() + interval);
    nextReviewDate.setHours(0, 0, 0, 0);

    capsule.nextReviewDate = nextReviewDate.toISOString();

    if (now >= nextReviewDate) {
        capsule.state = 'unlocked'; // 복습일이 되었거나 지남 -> 잠금 해제
    } else {
        capsule.state = 'locked'; // 아직 복습일이 아님 -> 잠김
        const diffTime = Math.abs(nextReviewDate - now);
        capsule.daysUntilUnlock = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// 복습 챌린지 시작
function startReview(capsule) {
    showChallengeModal(capsule, (confidence) => {
        // 사용자의 자신감 평가에 따라 기억 강도(strength) 업데이트
        capsule.reviews.push({ date: new Date().toISOString(), confidence });

        if (confidence === 'confident') {
            capsule.strength += 1; // 확신함 -> 기억 강도 증가
        } else if (confidence === 'unsure') {
            // 긴가민가함 -> 기억 강도 유지 (다음 복습 주기도 유지)
        } else { // 'guess'
            capsule.strength = Math.max(1, capsule.strength - 1); // 추측함 -> 기억 강도 감소 (최소 1)
        }
        
        // 변경된 캡슐 정보 저장
        const capsuleIndex = capsules.findIndex(c => c.id === capsule.id);
        if (capsuleIndex > -1) {
             capsules[capsuleIndex] = capsule;
        }
        
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        hideChallengeModal();
        
        // UI 즉시 새로고침
        initializeEbbinghaus(); 
    });
}

// 필터에 따라 캡슐을 렌더링하는 함수
function applyFilterAndRender() {
    let filteredCapsules = [];
    if (currentFilter === 'all') {
        filteredCapsules = capsules;
    } else {
        filteredCapsules = capsules.filter(c => c.state === currentFilter);
    }
    renderCapsuleStorage(filteredCapsules, startReview, currentFilter);
}


export function initializeEbbinghaus() {
    loadCapsules();
    applyFilterAndRender();

    // 필터 버튼 이벤트 리스너 설정
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilterAndRender();
        };
    });
}
