// --- 1단계: 필요한 모듈과 함수들을 가져옵니다 ---
import { ensureUserIsAuthenticated } from './firebase.js';
// ui.js 모듈에서 UI 객체를 가져옵니다. 이제 UI 관련 모든 조작은 이 객체를 통해 이루어집니다.
import { UI } from './ui.js'; 
// import * as Ebbinghaus from './ebbinghaus.js'; // (다음 단계에서 활성화 예정)

// --- 2단계: 앱의 전역 상태를 관리할 객체 ---
const appState = {
  user: null,
};

// --- 3단계: 앱의 초기화 및 메인 로직 ---
async function main() {
  const user = await ensureUserIsAuthenticated();

  if (user) {
    appState.user = user;
    
    // UI 모듈을 사용하여 첫 화면으로 '대시보드'를 보여줍니다.
    UI.switchView('dashboard'); 
    
    // 모든 이벤트 리스너들을 활성화합니다.
    setupEventListeners(); 

    console.log(`메인 앱 초기화 완료! 사용자 UID: ${appState.user.uid}`);
  } else {
    console.error("Firebase 인증 실패. 앱을 시작할 수 없습니다.");
    document.body.innerHTML = "<h1>앱을 초기화하는 데 실패했습니다. 인터넷 연결을 확인하고 새로고침 해주세요.</h1>";
  }
}

// --- 4단계: 사용자의 상호작용에 반응할 이벤트 리스너들 ---
function setupEventListeners() {
  // 앱 전체에 대한 클릭 이벤트를 감지합니다.
  document.body.addEventListener('click', (event) => {
    const target = event.target;
    
    // 사이드바 네비게이션 버튼 클릭을 감지합니다.
    const navBtn = target.closest('.nav-btn');
    if (navBtn) {
      const viewName = navBtn.dataset.view;
      // UI 모듈의 switchView 함수를 호출하여 화면을 전환합니다.
      UI.switchView(viewName);

      // TODO: '지식 정원' 탭을 클릭했을 때 Ebbinghaus.init()을 호출하는 로직을 나중에 추가합니다.
      // if (viewName === 'garden') {
      //   Ebbinghaus.init(appState.user.uid);
      // }
    }
    
    // TODO: 여기에 다른 모든 클릭 이벤트 처리 로직을 추가합니다.
  });

  // 툴팁 아이콘에 대한 마우스 이벤트를 설정합니다.
  const tooltipIcon = document.getElementById('course-tooltip-icon');
  const tooltip = document.getElementById('course-tooltip');
  if (tooltipIcon && tooltip) {
      tooltipIcon.addEventListener('mouseenter', () => {
          const rect = tooltipIcon.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.bottom + 10}px`;
          tooltip.style.display = 'block';
      });
      tooltipIcon.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
      });
  }
}

// --- 5단계: 앱 실행 ---
main();

