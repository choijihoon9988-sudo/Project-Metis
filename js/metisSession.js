import { switchStep, updateTimerDisplay, populateComparisonView, showLoader } from './ui.js';
import { getFeedback, getExpertSummary } from './api.js';

let state = {};
const initialState = {
    currentStep: 1,
    userInputs: {
        prediction: '',
        brainDump: '',
        aiPrediction: '',
        gap: '',
        finalWriting: ''
    },
    timerInterval: null,
    timeLeft: 25 * 60,
    sourceBook: '',
    initialGoal: ''
};

function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay(state.timeLeft);
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            alert("집중 독서 시간이 종료되었습니다!");
        }
    }, 1000);
}

function resetSession() {
    clearInterval(state.timerInterval);
    state = JSON.parse(JSON.stringify(initialState));
    updateTimerDisplay(state.timeLeft);
}

async function handleNextStep(nextStep) {
    const currentStep = state.currentStep;

    // Save input from current step
    if (currentStep === 1) state.userInputs.prediction = document.getElementById('prediction-input').value;
    if (currentStep === 3) state.userInputs.brainDump = document.getElementById('braindump-input').value;
    if (currentStep === 4) state.userInputs.aiPrediction = document.getElementById('ai-prediction-input').value;
    if (currentStep === 6) state.userInputs.gap = document.getElementById('gap-input').value;

    // Handle special actions for next steps
    if (nextStep === 2) {
        startTimer();
    }
    
    if (nextStep === 5) {
        showLoader(true);
        const [feedback, expertSummary] = await Promise.all([
            getFeedback(state.userInputs.brainDump),
            getExpertSummary()
        ]);
        populateComparisonView(state.userInputs, { feedback, expertSummary });
        showLoader(false);
    }
    
    state.currentStep = nextStep;
    switchStep(nextStep);
}

function plantNewCapsule() {
    const capsules = JSON.parse(localStorage.getItem('knowledgeCapsules')) || [];
    const newCapsule = {
        id: Date.now(),
        title: state.userInputs.gap.substring(0, 40) + '...',
        sourceBook: state.sourceBook,
        question: `다음 질문에 대해 설명하세요: "${state.userInputs.gap}"`,
        answer: state.userInputs.finalWriting,
        strength: 1,
        reviews: [{ date: new Date().toISOString(), confidence: 'confident' }]
    };

    if (!capsules.some(c => c.question.includes(state.userInputs.gap))) {
        capsules.push(newCapsule);
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        alert("지식 보관소에 새로운 타임캡슐을 보관했습니다!");
    }
}

export function initializeSession(note = null) {
    resetSession();
    
    if (note) {
        // Session started from a Reading Note
        state.sourceBook = note.book;
        state.initialGoal = note.content;
        document.getElementById('session-goal-display').innerHTML = `
            <strong>🎯 현재 목표 (독서 노트에서 가져옴)</strong>
            <p>${note.content}</p>`;
        // Prediction step can be auto-filled or modified
        document.getElementById('prediction-input').value = `"${note.content}" 구절을 더 깊이 이해하기 위한 탐색.`;
    } else {
        // Session started from the Dashboard Main Book
        state.sourceBook = document.querySelector('#main-book-slot h4').textContent;
        state.initialGoal = document.querySelector('#main-book-goal p').textContent;
        const currentGoalHtml = document.getElementById('main-book-goal').innerHTML;
        document.getElementById('session-goal-display').innerHTML = currentGoalHtml;
    }
    
    switchStep(1);

    // Attach event listeners for this session
    document.querySelectorAll('#metis-session .next-step-btn').forEach(btn => {
        btn.onclick = () => handleNextStep(parseInt(btn.dataset.next, 10));
    });

    document.getElementById('back-to-dashboard-btn').onclick = () => {
        if (confirm("세션을 중단하고 이전 화면으로 돌아가시겠습니까?")) {
            const event = new CustomEvent('sessionComplete');
            document.dispatchEvent(event);
        }
    };

    document.getElementById('finish-session-btn').onclick = () => {
        state.userInputs.finalWriting = document.getElementById('final-writing-input').value;
        state.userInputs.gap = document.getElementById('gap-input').value; 
        
        if (!state.userInputs.gap || !state.userInputs.finalWriting) {
            alert('핵심 질문과 체화 글쓰기를 모두 작성해야 캡슐을 보관할 수 있습니다.');
            return;
        }

        plantNewCapsule();
        const event = new CustomEvent('sessionComplete');
        document.dispatchEvent(event);
    };
}

export function handleSessionCompletion() {
    resetSession();
}