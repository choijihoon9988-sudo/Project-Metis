// js/main.js

// --- 1단계: 필요한 모듈들을 모두 가져옵니다 ---
import { ensureUserIsAuthenticated } from './firebase.js';
import { UI } from './ui.js';
import { Ebbinghaus } from './ebbinghaus.js';
import { MetisSession } from './metisSession.js';
// 새로 만든 전문가 모듈들을 가져옵니다.
import { BookExplorer } from './bookExplorer.js';
import { GoalNavigator } from './goalNavigator.js';


// --- 2단계: 앱의 전역 상태 ---
const appState = {
  user: null,
};

// --- 3단계: 앱 초기화 및 메인 로직 ---
async function main() {
  const user = await ensureUserIsAuthenticated();

  if (user) {
    appState.user = user;
    UI.switchView('dashboard');
    setupEventListeners();
    console.log(`메인 앱 초기화 완료! 사용자 UID: ${appState.user.uid}`);
  } else {
    console.error("Firebase 인증 실패. 앱을 시작할 수 없습니다.");
  }
}

// --- 4단계: 모든 사용자 상호작용(이벤트)을 처리하는 곳 ---
function setupEventListeners() {
  document.body.addEventListener('click', (event) => {
    const target = event.target;

    // 사이드바 네비게이션
    const navBtn = target.closest('.nav-btn');
    if (navBtn) {
      const viewName = navBtn.dataset.view;
      UI.switchView(viewName);
      if (viewName === 'garden') Ebbinghaus.initGarden();
      return;
    }

    // --- 대시보드 버튼들 ---
    const dashboard = target.closest('#dashboard');
    if(dashboard) {
        if(target.closest('#start-session-btn')) {
            UI.switchView('metis-session-view');
            MetisSession.init();
            return;
        }
        if(target.closest('#change-book-btn')) {
            BookExplorer.init(); // 도서 탐색기 시작
            return;
        }
        if(target.closest('#start-goal-navigator-btn')) {
            const currentBookTitle = document.getElementById('main-book-title').textContent;
            GoalNavigator.init(currentBookTitle); // 목표 내비게이터 시작
            return;
        }
        if(target.closest('.course-btn')) {
            document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
            target.closest('.course-btn').classList.add('active');
        }
    }
    
    // --- 메티스 세션 버튼들 ---
    const sessionView = target.closest('#metis-session-view');
    if(sessionView) {
        if (target.closest('.next-step-btn')) { MetisSession.proceed(); return; }
        if (target.closest('#finish-reading-btn')) { MetisSession.proceed(); return; }
        if (target.closest('#finish-session-btn')) { MetisSession.complete(); return; }
    }
  });

  // --- 커스텀 이벤트 리스너들 ---
  // BookExplorer가 '책 선택 완료' 신호를 보냈을 때
  document.addEventListener('bookSelected', (e) => {
    const book = e.detail;
    // 대시보드 UI 업데이트
    document.getElementById('main-book-cover').src = book.cover;
    document.getElementById('main-book-title').textContent = book.title;
    document.getElementById('main-book-author').textContent = book.author;
    UI.showToast(`${book.title}(으)로 메인북이 변경되었습니다!`, 'success');

    // 자연스러운 흐름을 위해 바로 목표 설정 단계로 연결
    GoalNavigator.init(book.title);
  });

  // GoalNavigator가 '목표 확정' 신호를 보냈을 때
  document.addEventListener('goalSelected', (e) => {
    const { level, text } = e.detail;
    // 대시보드 UI 업데이트
    document.querySelector('#main-book-goal').innerHTML = `<strong>🎯 현재 목표 (레벨 ${level})</strong><p>${text}</p>`;
    UI.showToast('새로운 학습 목표가 설정되었습니다.', 'success');
  });

  // MetisSession이 '세션 완료' 신호를 보냈을 때
  document.addEventListener('sessionComplete', (e) => {
    if (e.detail.finished) {
        Ebbinghaus.plantSeed(e.detail.data);
        UI.showToast("세션 완료! 지식 정원에 새 씨앗이 심어졌습니다.", "success");
    }
    UI.switchView('garden');
    Ebbinghaus.initGarden();
  });

  // 툴팁 이벤트
  const tooltipIcon = document.getElementById('course-tooltip-icon');
  if (tooltipIcon) {
      tooltipIcon.addEventListener('mouseenter', () => UI.Tooltip.show(tooltipIcon));
      tooltipIcon.addEventListener('mouseleave', () => UI.Tooltip.hide());
  }
}

// --- 5단계: 앱 실행 ---
main();

