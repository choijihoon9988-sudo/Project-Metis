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
    // 초기 정원 로드
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

    // --- 대시보드 ---
    const dashboard = target.closest('#dashboard');
    if (dashboard) {
        if(target.closest('#start-session-btn')) { 
            UI.switchView('metis-session-view'); 
            MetisSession.init(); 
            return; 
        }
        if(target.closest('#change-book-btn')) { 
            BookExplorer.init(); 
            return; 
        }
        if(target.closest('#start-goal-navigator-btn')) { 
            const title = document.getElementById('main-book-title').textContent;
            if (title) GoalNavigator.init(title);
            return; 
        }
        const courseBtn = target.closest('.course-btn');
        if(courseBtn) {
            document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
            courseBtn.classList.add('active');
        }
        return;
    }

    // --- 메티스 세션 ---
    const sessionView = target.closest('#metis-session-view');
    if(sessionView) {
        if (target.closest('.next-step-btn')) { MetisSession.proceed(); return; }
        if (target.closest('#finish-session-btn')) { MetisSession.complete(); return; }
        if (target.closest('#back-to-dashboard-btn')) { 
            UI.showConfirm("세션을 중단하고 대시보드로 돌아가시겠습니까?", () => {
                 UI.switchView('dashboard');
            });
            return; 
        }
    }
    
    // --- 지식 정원 & 대시보드 ---
    const plantCard = target.closest('.plant-card');
    if(plantCard) {
        const plantId = plantCard.dataset.id;
        appState.currentPlant = Ebbinghaus.getPlantById(plantId);
        if (!appState.currentPlant) return;

        // 건강 상태와 상관없이 클릭 시 항상 대시보드를 먼저 보여줌
        const chartConfig = Ebbinghaus.createChartConfig(appState.currentPlant);
        UI.Dashboard.show(appState.currentPlant, chartConfig);
        return;
    }
    
    const dashboardModal = target.closest('#dashboard-modal-overlay');
    if (dashboardModal) {
        // 모달 바깥 영역 클릭 시 닫기
        if (!target.closest('.modal-content')) { 
            UI.Dashboard.hide(); 
            return;
        }

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
        
        // 대시보드 내에서 복습 시작
        const startReviewBtn = target.closest('#dashboard-start-review-btn');
        if (startReviewBtn) {
            if (appState.currentPlant) {
                UI.Dashboard.hide(); // 대시보드 닫기
                Ebbinghaus.startReview(appState.currentPlant.id);
            }
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
    // 책 변경 후 바로 목표 설정 내비게이터 실행
    GoalNavigator.init(book.title);
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
    // 중단 시에는 아무것도 하지 않고 대시보드에 머무름
  });
}

// 앱 시작
main();