import { switchView } from './ui.js';
import { initializeSession, handleSessionCompletion } from './metisSession.js';
import { initializeEbbinghaus } from './ebbinghaus.js';
import { initializeGoalNavigator } from './goalNavigator.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const startSessionBtn = document.getElementById('start-session-btn');
    const startGoalNavigatorBtn = document.getElementById('start-goal-navigator-btn');
    let lastView = 'dashboard';

    // --- 뷰 전환 로직 ---
    const handleViewSwitch = (viewName) => {
        const currentActive = document.querySelector('.view.active');
        if (currentActive) {
            lastView = currentActive.id;
        }
        
        switchView(viewName, navButtons);
        
        // 새로운 뷰에 따라 모듈 초기화
        if (viewName === 'storage') {
            initializeEbbinghaus();
        }
    };

    // --- 이벤트 핸들러 ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => handleViewSwitch(btn.dataset.view));
    });

    startSessionBtn.addEventListener('click', () => {
        handleViewSwitch('metis-session');
        initializeSession();
    });
    
    startGoalNavigatorBtn.addEventListener('click', () => {
        initializeGoalNavigator();
    });

    // --- 커스텀 이벤트 리스너 ---
    document.addEventListener('sessionComplete', () => {
        handleSessionCompletion();
        // 세션이 끝나면 지식 보관소로 이동하여 방금 만든 캡슐 확인
        handleViewSwitch('storage'); 
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
