import { switchStep, updateTimerDisplay, showToast } from './ui.js';

let state = {};
const initialState = {
    currentStep: 1,
    userInputs: {
        prediction: '',
        brainDump: '',
        finalWriting: ''
    },
    timerInterval: null,
    timeLeft: 25 * 60,
    sourceBook: '',
    initialGoal: ''
};

export function getSessionState() {
    return state;
}

function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay(state.timeLeft);
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            showToast("집중 독서 시간이 종료되었습니다!", "success");
            handleNextStep(3);
        }
    }, 1000);
}

export function resetSession() {
    clearInterval(state.timerInterval);
    state = JSON.parse(JSON.stringify(initialState));
    updateTimerDisplay(state.timeLeft);
}

export function handleNextStep(nextStep) {
    const currentStep = state.currentStep;

    if (currentStep === 1) state.userInputs.prediction = document.getElementById('prediction-input').value;
    if (currentStep === 3) state.userInputs.brainDump = document.getElementById('braindump-input').value;

    if (nextStep === 2) {
        startTimer();
    }
    
    state.currentStep = nextStep;
    switchStep(nextStep);
}

export function plantNewCapsule() {
    const capsules = JSON.parse(localStorage.getItem('knowledgeCapsules')) || [];
    const newCapsule = {
        id: Date.now(),
        title: state.initialGoal.substring(0, 40) + '...',
        sourceBook: state.sourceBook,
        question: `[목표] ${state.initialGoal}\n\n위 목표에 대해 당신이 체화한 지식을 설명하세요.`,
        answer: state.userInputs.finalWriting,
        strength: 1,
        reviews: [{ date: new Date().toISOString(), confidence: 'confident' }] 
    };

    if (!capsules.some(c => c.question.includes(state.initialGoal))) {
        capsules.push(newCapsule);
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        showToast("새로운 지식 타임캡슐을 봉인했습니다!", "success");
    } else {
        showToast("이미 동일한 목표의 캡슐이 존재합니다.", "error");
    }
}

export function initializeSession() {
    resetSession();
    
    state.sourceBook = document.querySelector('#main-book-slot h4').textContent;
    state.initialGoal = document.querySelector('#main-book-goal p').textContent;
    const currentGoalHtml = document.getElementById('main-book-goal').innerHTML;
    document.getElementById('session-goal-display').innerHTML = currentGoalHtml;
    
    switchStep(1);
}

export function handleSessionCompletion() {
    resetSession();
}

