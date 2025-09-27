// js/main.js

import { ensureUserIsAuthenticated } from './firebase.js';
import { UI } from './ui.js';
import { Ebbinghaus } from './ebbinghaus.js';
import { MetisSession } from './metisSession.js';
import { BookExplorer } from './bookExplorer.js';
import { GoalNavigator } from './goalNavigator.js';

const appState = {
  user: null,
  currentPlant: null,
};

async function main() {
  const user = await ensureUserIsAuthenticated();
  if (user) {
    appState.user = user;
    Ebbinghaus.setUser(user.uid); // Ebbinghaus 모듈에 사용자 ID 전달
    UI.switchView('dashboard');
    setupEventListeners();
  } else {
    console.error("Firebase 인증 실패.");
  }
}

function setupEventListeners() {
  document.body.addEventListener('click', async (event) => { // 비동기 함수로 변경
    const target = event.target;

    // --- 사이드바 ---
    const navBtn = target.closest('.nav-btn');
    if (navBtn) {
      const viewName = navBtn.dataset.view;
      UI.switchView(viewName);
      if (viewName === 'garden') await Ebbinghaus.initGarden(); // 비동기 호출로 변경
      if (viewName === 'journey') await Ebbinghaus.initJourneyMap(); // 비동기 호출로 변경
      return;
    }

    // --- 메티스 세션 ---
    if(target.closest('#metis-session-view')) {
        // ... 기존 코드 ...
        if (target.closest('.next-step-btn') || target.closest('#finish-reading-btn')) { MetisSession.proceed(); return; }
        if (target.closest('#finish-session-btn')) { MetisSession.complete(); return; }
        if (target.closest('#back-to-dashboard-btn')) { UI.switchView('dashboard'); return; } // 뒤로가기 기능 추가
    }

    // ... 나머지 기존 이벤트 리스너 코드 ...
    if (target.closest('#dashboard')) {
        if(target.closest('#start-session-btn')) { UI.switchView('metis-session-view'); MetisSession.init(); return; }
        if(target.closest('#change-book-btn')) { BookExplorer.init(); return; }
        if(target.closest('#start-goal-navigator-btn')) { GoalNavigator.init(document.getElementById('main-book-title').textContent); return; }
        if(target.closest('.course-btn')) {
            document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
            target.closest('.course-btn').classList.add('active');
        }
    }
    const plantCard = target.closest('.plant-card');
    if(plantCard) {
        const plantId = plantCard.dataset.id;
        appState.currentPlant = Ebbinghaus.getPlantById(plantId);
        if (!appState.currentPlant) return;

        if (appState.currentPlant.status === 'healthy') {
            const chartConfig = Ebbinghaus.createChartConfig(appState.currentPlant);
            UI.Dashboard.show(appState.currentPlant, chartConfig);
        } else {
            Ebbinghaus.startReview(plantId);
        }
        return;
    }
    if (target.closest('#dashboard-modal-overlay') && !target.closest('.modal-content')) { UI.Dashboard.hide(); return; }
    const simulateBtn = target.closest('#simulate-review-btn');
    if (simulateBtn) {
        if(!appState.currentPlant) return;
        const simulatedStrength = appState.currentPlant.strength + 1;
        const simulatedData = {
            label: '시뮬레이션: 오늘 복습 시',
            data: Ebbinghaus.generateCurveData(new Date(), simulatedStrength),
            borderColor: 'rgba(66, 133, 244, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0
        };
        UI.Dashboard.updateChart(simulatedData);
        simulateBtn.disabled = true;
        simulateBtn.textContent = '✅ 시뮬레이션 완료';
        return;
    }
  });

  // --- 커스텀 이벤트 리스너들 ---
  document.addEventListener('bookSelected', (e) => {
    // ... 기존 코드 ...
    const book = e.detail;
    document.getElementById('main-book-cover').src = book.cover;
    document.getElementById('main-book-title').textContent = book.title;
    document.getElementById('main-book-author').textContent = book.author;
    UI.showToast(`${book.title}(으)로 메인북이 변경되었습니다!`, 'success');
    GoalNavigator.init(book.title);
  });

  document.addEventListener('goalSelected', (e) => {
    // ... 기존 코드 ...
    const { level, text } = e.detail;
    document.querySelector('#main-book-goal').innerHTML = `<strong>🎯 현재 목표 (레벨 ${level})</strong><p>${text}</p>`;
    UI.showToast('새로운 학습 목표가 설정되었습니다.', 'success');
  });

  document.addEventListener('sessionComplete', async (e) => { // 비동기 함수로 변경
    if (e.detail.finished) {
        await Ebbinghaus.plantSeed(e.detail.data); // 비동기 호출로 변경
        UI.showToast("세션 완료! 지식 정원에 새 씨앗이 심어졌습니다.", "success");
    }
    UI.switchView('garden');
    await Ebbinghaus.initGarden(); // 비동기 호출로 변경
  });
}

main();

