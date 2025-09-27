import { switchView, showConfirmModal, showToast } from './ui.js';
import { initializeSession, handleSessionCompletion, getSessionState, handleNextStep, plantNewCapsule } from './metisSession.js';
import { initializeEbbinghaus, startReview } from './ebbinghaus.js';
import { initializeGoalNavigator } from './goalNavigator.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 전역 상태 및 DOM 요소 ---
    const appContainer = document.querySelector('.app-container');
    let lastView = 'dashboard';

    // --- 뷰 전환 로직 ---
    const handleViewSwitch = (viewName) => {
        const currentActive = document.querySelector('.view.active');
        if (currentActive) {
            lastView = currentActive.id;
        }
        const navButtons = document.querySelectorAll('.nav-btn');
        switchView(viewName, navButtons);
        
        if (viewName === 'storage') {
            initializeEbbinghaus();
        }
    };

    // --- 전역 이벤트 핸들러 (이벤트 위임) ---
    appContainer.addEventListener('click', (e) => {
        const target = e.target;

        // 1. 네비게이션 버튼
        const navBtn = target.closest('.nav-btn');
        if (navBtn) {
            handleViewSwitch(navBtn.dataset.view);
            return;
        }

        // 2. 세션 시작 버튼
        if (target.closest('#start-session-btn')) {
            handleViewSwitch('metis-session');
            initializeSession();
            return;
        }

        // 3. AI 목표 설정 시작 버튼
        if (target.closest('#start-goal-navigator-btn')) {
            initializeGoalNavigator();
            return;
        }

        // 4. 메티스 세션 내부 버튼
        const sessionView = target.closest('#metis-session');
        if (sessionView) {
            if (target.closest('.next-step-btn')) {
                handleNextStep(parseInt(target.closest('.next-step-btn').dataset.next, 10));
            } else if (target.closest('#finish-session-btn')) {
                const finalWriting = document.getElementById('final-writing-input').value;
                if (!finalWriting.trim()) {
                    showToast('체화 글쓰기를 작성해야 캡슐을 봉인할 수 있습니다.', 'error');
                    return;
                }
                getSessionState().userInputs.finalWriting = finalWriting;
                plantNewCapsule();
                document.dispatchEvent(new CustomEvent('sessionComplete', { detail: { finished: true } }));
            } else if (target.closest('#back-to-dashboard-btn')) {
                 showConfirmModal("세션을 중단하고 돌아가시겠습니까?", () => {
                    document.dispatchEvent(new CustomEvent('sessionComplete', { detail: { finished: false } }));
                });
            }
            return;
        }
        
        // 5. 지식 보관소 (타임캡슐) 필터 버튼
        const filterBtn = target.closest('.filter-btn');
        if (filterBtn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            filterBtn.classList.add('active');
            initializeEbbinghaus(filterBtn.dataset.filter); // 필터 적용하여 새로고침
            return;
        }

        // 6. 잠금 해제된 캡슐 클릭 (복습 시작)
        const unlockedCapsule = target.closest('.capsule.unlocked');
        if(unlockedCapsule){
            startReview(unlockedCapsule.dataset.id);
            return;
        }
    });


    // --- 커스텀 이벤트 리스너 ---
    document.addEventListener('sessionComplete', (e) => {
        handleSessionCompletion();
        if (e.detail && e.detail.finished) {
            handleViewSwitch('storage');
        } else {
            handleViewSwitch('dashboard');
        }
    });

    document.addEventListener('goalSelected', (e) => {
        const { level, text } = e.detail;
        const goalEl = document.querySelector('#main-book-goal');
        goalEl.innerHTML = `
            <strong>🎯 현재 목표 (레벨 ${level})</strong>
            <p>${text}</p>
        `;
    });
    
    // --- 앱 시작 ---
    handleViewSwitch('dashboard');
});

