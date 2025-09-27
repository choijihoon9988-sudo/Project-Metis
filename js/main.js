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
    Ebbinghaus.setUser(user.uid);
    UI.switchView('dashboard');
    setupEventListeners();
    await Ebbinghaus.initGarden();
  } else {
    console.error("Firebase 인증 실패. 앱을 초기화할 수 없습니다.");
    UI.showToast("사용자 인증에 실패했습니다. 새로고침 해주세요.", "error");
  }
}

function setupEventListeners() {
  document.body.addEventListener('click', async (event) => {
    const target = event.target;

    // --- 사이드바 네비게이션 ---
    const navBtn = target.closest('.nav-btn');
    if (navBtn) {
      const viewName = navBtn.dataset.view;
      UI.switchView(viewName);
      if (viewName === 'garden') await Ebbinghaus.initGarden();
      if (viewName === 'journey') await Ebbinghaus.initJourneyMap();
      return;
    }

    // --- 대시보드 버튼 ---
    if (target.closest('#start-session-btn')) {
      UI.switchView('metis-session-view');
      MetisSession.init();
      return;
    }
    if (target.closest('#change-book-btn')) {
      BookExplorer.init();
      return;
    }
    if (target.closest('#start-goal-navigator-btn')) {
      const title = document.getElementById('main-book-title').textContent;
      if (title) GoalNavigator.init({ title }); // GoalNavigator가 객체를 받도록 수정
      return;
    }
    const courseBtn = target.closest('.course-btn');
    if (courseBtn) {
      document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
      courseBtn.classList.add('active');
      return;
    }

    // --- 메티스 세션 버튼 ---
    if (target.closest('.next-step-btn')) {
      MetisSession.proceed();
      return;
    }
    if (target.closest('#finish-session-btn')) {
      MetisSession.complete();
      return;
    }
    if (target.closest('#back-to-dashboard-btn')) {
      UI.showConfirm("세션을 중단하고 대시보드로 돌아가시겠습니까?", () => {
        UI.switchView('dashboard');
      });
      return;
    }

    // --- 지식 정원 & 대시보드 모달 ---
    const plantCard = target.closest('.plant-card');
    if (plantCard) {
      const plantId = plantCard.dataset.id;
      appState.currentPlant = Ebbinghaus.getPlantById(plantId);
      if (appState.currentPlant) {
        const chartConfig = Ebbinghaus.createChartConfig(appState.currentPlant);
        UI.Dashboard.show(appState.currentPlant, chartConfig);
      }
      return;
    }
    
    // --- 모달 관련 버튼 ---
    const dashboardModal = target.closest('#dashboard-modal-overlay');
    if (dashboardModal && !target.closest('.modal-content')) {
      UI.Dashboard.hide();
      return;
    }
    if (target.closest('#simulate-review-btn')) {
      if (!appState.currentPlant) return;
      const simulatedStrength = appState.currentPlant.strength + 1;
      const simulatedData = {
        label: '시뮬레이션: 오늘 복습 시',
        data: Ebbinghaus.generateCurveData(new Date(), simulatedStrength),
        borderColor: 'rgba(66, 133, 244, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0
      };
      UI.Dashboard.updateChart(simulatedData);
      target.closest('#simulate-review-btn').disabled = true;
      target.closest('#simulate-review-btn').textContent = '✅ 시뮬레이션 완료';
      return;
    }
    if (target.closest('#dashboard-start-review-btn')) {
      if (appState.currentPlant) {
        UI.Dashboard.hide();
        Ebbinghaus.startReview(appState.currentPlant.id);
      }
    }
  });

  // --- 커스텀 이벤트 리스너 ---
  document.addEventListener('bookSelected', (e) => {
    const book = e.detail;
    document.getElementById('main-book-cover').src = book.cover;
    document.getElementById('main-book-title').textContent = book.title;
    document.getElementById('main-book-author').textContent = book.author;
    UI.showToast(`'${book.title}'(으)로 메인북 변경!`, 'success');
    GoalNavigator.init(book);
  });

  document.addEventListener('goalSelected', (e) => {
    const { level, text } = e.detail;
    document.querySelector('#main-book-goal').innerHTML = `<strong>🎯 현재 목표 (레벨 ${level})</strong><p>${text}</p>`;
    UI.showToast('새로운 학습 목표가 설정되었습니다.', 'success');
  });

  document.addEventListener('sessionComplete', async (e) => {
    if (e.detail.finished) {
      await Ebbinghaus.plantSeed(e.detail.data);
      UI.switchView('garden');
      await Ebbinghaus.initGarden();
    }
  });
}

main();