import { showGoalNavigator, hideGoalNavigator, renderGoalNavigatorStep, showToast } from './ui.js';

let state = {};

const getGoalPackForBook = (bookTitle) => {
    return [
        { level: 1, text: `'${bookTitle}'에서 '핵심 개념 A'의 정의를 찾고, 실생활 사례 1가지 찾아보기.` },
        { level: 2, text: `'${bookTitle}'의 1부에서 설명하는 '주요 원칙 3가지'를 활용하여, 나의 현재 문제를 해결할 구체적인 액션 플랜 작성하기.` },
        { level: 2, text: `'${bookTitle}'의 내용을 바탕으로, 동료/친구에게 특정 주제를 5분간 설명하는 스크립트 작성하기.` },
        { level: 3, text: `'${bookTitle}' 저자의 핵심 주장에 대한 가장 강력한 반론을 한 문단으로 제시하기.` },
    ];
};

const getSolverGoal = (bookTitle, problem) => {
    return {
        level: 2,
        text: `'${bookTitle}'의 내용을 활용하여, '${problem.substring(0, 20)}...' 문제를 해결하기 위한 3가지 실행 가능한 전략을 도출하시오.`
    };
};

function handleModalClick(event) {
    const target = event.target;

    const modeButton = target.closest('.mode-select-btn');
    if (modeButton) {
        handleModeSelection(modeButton.dataset.mode);
        return;
    }

    const goalCard = target.closest('.goal-card');
    if (goalCard) {
        state.selectedGoal = { level: goalCard.dataset.level, text: goalCard.dataset.text };
        renderStep('architect', state.selectedGoal);
        return;
    }

    const solverSubmitBtn = target.closest('#solver-submit-problem');
    if (solverSubmitBtn) {
        const problemInput = document.getElementById('solver-problem-input');
        const problem = problemInput ? problemInput.value : '';
        
        if (!problem.trim()) {
            showToast('해결하고 싶은 문제를 입력해주세요.', 'error');
            problemInput.focus();
            return;
        }
        
        state.selectedGoal = getSolverGoal(state.bookTitle, problem);
        renderStep('architect', state.selectedGoal);
        return;
    }

    const architectConfirmBtn = target.closest('#architect-confirm-goal');
    if (architectConfirmBtn) {
        const editor = document.getElementById('architect-goal-editor');
        const finalText = editor ? editor.value : '';
        state.selectedGoal.text = finalText;
        
        const goalEvent = new CustomEvent('goalSelected', { detail: state.selectedGoal });
        document.dispatchEvent(goalEvent);

        hideGoalNavigator();
        return;
    }
}

function renderStep(stepName, data = {}) {
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
        showToast('목표를 설정할 책 제목을 먼저 입력해주세요!', 'error');
        bookTitleEl.focus();
        return;
    }

    state = {
        bookTitle: bookTitle,
        mode: null,
        selectedGoal: null,
    };
    
    const modalContent = document.getElementById('goal-navigator-content');
    modalContent.removeEventListener('click', handleModalClick);
    modalContent.addEventListener('click', handleModalClick);
    
    renderStep('modeSelection', { bookTitle });
    showGoalNavigator();
}

