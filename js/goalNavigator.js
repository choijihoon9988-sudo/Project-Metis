import { showGoalNavigator, hideGoalNavigator, renderGoalNavigatorStep } from './ui.js';

let state = {};

// --- Mock Data ---
// 실제 앱에서는 이 부분이 AI API 호출로 대체될 수 있습니다.
const getGoalPackForBook = (bookTitle) => {
    return [
        { level: 1, text: `'${bookTitle}'에서 '핵심 개념 A'의 정의를 찾고, 실생활 사례 1가지 찾아보기.` },
        { level: 2, text: `'${bookTitle}'의 1부에서 설명하는 '주요 원칙 3가지'를 활용하여, 나의 현재 문제를 해결할 구체적인 액션 플랜 작성하기.` },
        { level: 2, text: `'${bookTitle}'의 내용을 바탕으로, 동료/친구에게 특정 주제를 5분간 설명하는 스크립트 작성하기.` },
        { level: 3, text: `'${bookTitle}' 저자의 핵심 주장에 대한 가장 강력한 반론을 한 문단으로 제시하기.` },
    ];
};

const getSolverGoal = (bookTitle, problem) => {
    // AI가 사용자의 문제를 책 내용과 연결하여 목표를 생성하는 것을 시뮬레이션합니다.
    return {
        level: 2,
        text: `'${bookTitle}'의 내용을 활용하여, '${problem.substring(0, 20)}...' 문제를 해결하기 위한 3가지 실행 가능한 전략을 도출하시오.`
    };
};

// --- Event Handlers & Logic ---

/**
 * 모달 내부에서 발생하는 모든 클릭 이벤트를 위임받아 처리하는 단일 핸들러.
 * @param {Event} event - 발생한 클릭 이벤트 객체
 */
function handleModalClick(event) {
    const target = event.target;

    // 1. 모드 선택 버튼('.mode-select-btn') 클릭 처리
    const modeButton = target.closest('.mode-select-btn');
    if (modeButton) {
        handleModeSelection(modeButton.dataset.mode);
        return;
    }

    // 2. 목표 카드('.goal-card') 클릭 처리
    const goalCard = target.closest('.goal-card');
    if (goalCard) {
        state.selectedGoal = { level: goalCard.dataset.level, text: goalCard.dataset.text };
        renderStep('architect', state.selectedGoal);
        return;
    }

    // 3. 해결사 모드 문제 제출 버튼('#solver-submit-problem') 클릭 처리
    const solverSubmitBtn = target.closest('#solver-submit-problem');
    if (solverSubmitBtn) {
        const problemInput = document.getElementById('solver-problem-input');
        const problem = problemInput ? problemInput.value : '';
        
        if (!problem.trim()) {
            const problemContainer = document.querySelector('.solver-chat');
            if (problemContainer) {
                let errorMsg = problemContainer.querySelector('.error-message');
                if (!errorMsg) {
                    errorMsg = document.createElement('p');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = 'red';
                    problemContainer.appendChild(errorMsg);
                }
                errorMsg.textContent = '해결하고 싶은 문제를 입력해주세요.';
                problemInput.focus();
            }
            return;
        }
        
        state.selectedGoal = getSolverGoal(state.bookTitle, problem);
        renderStep('architect', state.selectedGoal);
        return;
    }

    // 4. 최종 목표 확정 버튼('#architect-confirm-goal') 클릭 처리
    const architectConfirmBtn = target.closest('#architect-confirm-goal');
    if (architectConfirmBtn) {
        const editor = document.getElementById('architect-goal-editor');
        const finalText = editor ? editor.value : '';
        state.selectedGoal.text = finalText;
        
        // main.js에 목표가 선택되었음을 알리는 커스텀 이벤트 발생
        const goalEvent = new CustomEvent('goalSelected', { detail: state.selectedGoal });
        document.dispatchEvent(goalEvent);

        hideGoalNavigator();
        return;
    }
}

function renderStep(stepName, data = {}) {
    // UI를 렌더링하고, 이벤트 처리는 상위의 handleModalClick에 위임한다.
    renderGoalNavigatorStep(stepName, data);
}

function handleModeSelection(mode) {
    state.mode = mode;
    if (mode === 'explorer') {
        renderStep('explorer', { goalPack: getGoalPackForBook(state.bookTitle) });
    } else if (mode === 'solver') {
        renderStep('solver');
    }
}

export function initializeGoalNavigator() {
    const bookTitleEl = document.getElementById('book-title-for-goal');
    const bookTitle = bookTitleEl ? bookTitleEl.value : '';

    if (!bookTitle.trim()) {
        // alert() 대신 입력창에 시각적 피드백 제공
        bookTitleEl.style.borderColor = 'red';
        bookTitleEl.placeholder = '목표를 설정할 책 제목을 먼저 입력해주세요!';
        bookTitleEl.focus();
        setTimeout(() => {
            bookTitleEl.style.borderColor = ''; // 3초 후 스타일 초기화
            bookTitleEl.placeholder = '책 제목을 입력하세요';
        }, 3000);
        return;
    }

    state = {
        bookTitle: bookTitle,
        mode: null,
        selectedGoal: null,
    };
    
    // 모달 컨텐츠 영역에 이벤트 리스너를 단 한 번만 설정
    const modalContent = document.getElementById('goal-navigator-content');
    modalContent.removeEventListener('click', handleModalClick); // 중복 방지를 위해 기존 리스너 제거
    modalContent.addEventListener('click', handleModalClick);
    
    renderStep('modeSelection', { bookTitle });
    showGoalNavigator();
}

