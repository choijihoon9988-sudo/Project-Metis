import { switchStep, updateTimerDisplay } from './ui.js';

let state = {};
// 단순화된 4단계 세션을 위한 초기 상태
const initialState = {
    currentStep: 1,
    userInputs: {
        prediction: '',
        brainDump: '',
        finalWriting: ''
    },
    timerInterval: null,
    timeLeft: 25 * 60, // 25분
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
            // 자동으로 다음 단계로 이동
            handleNextStep(3);
        }
    }, 1000);
}

function resetSession() {
    clearInterval(state.timerInterval);
    // Deep copy to avoid reference issues
    state = JSON.parse(JSON.stringify(initialState));
    updateTimerDisplay(state.timeLeft);
}

// 다음 단계로 이동하는 로직
function handleNextStep(nextStep) {
    const currentStep = state.currentStep;

    // 현재 단계의 사용자 입력을 상태에 저장
    if (currentStep === 1) state.userInputs.prediction = document.getElementById('prediction-input').value;
    if (currentStep === 3) state.userInputs.brainDump = document.getElementById('braindump-input').value;

    // 특정 단계 진입 시 특별한 액션 처리
    if (nextStep === 2) {
        startTimer();
    }
    
    state.currentStep = nextStep;
    switchStep(nextStep);
}

// 세션 완료 후 새로운 지식 타임캡슐을 생성하는 함수
function plantNewCapsule() {
    const capsules = JSON.parse(localStorage.getItem('knowledgeCapsules')) || [];
    
    // 최종 글쓰기 내용을 기반으로 캡슐 생성
    const newCapsule = {
        id: Date.now(),
        title: state.initialGoal.substring(0, 40) + '...', // 목표를 제목으로 사용
        sourceBook: state.sourceBook,
        question: `[목표] ${state.initialGoal}\n\n위 목표에 대해 당신이 체화한 지식을 설명하세요.`, // 복습 시 질문
        answer: state.userInputs.finalWriting, // 사용자의 최종 글이 정답
        strength: 1, // 기억 강도 초기값
        // 에빙하우스 곡선 시작을 위해 첫 리뷰 날짜를 오늘로 기록
        reviews: [{ date: new Date().toISOString(), confidence: 'confident' }] 
    };

    // 중복 방지 (같은 목표의 캡슐이 이미 있는지 확인)
    if (!capsules.some(c => c.title === newCapsule.title)) {
        capsules.push(newCapsule);
        localStorage.setItem('knowledgeCapsules', JSON.stringify(capsules));
        alert("지식 타임캡슐 보관소에 새로운 지식을 봉인했습니다!");
    } else {
        alert("이미 동일한 목표에 대한 캡슐이 존재합니다.");
    }
}

export function initializeSession() {
    resetSession();
    
    // 대시보드에서 설정된 메인북 정보 가져오기
    state.sourceBook = document.querySelector('#main-book-slot h4').textContent;
    state.initialGoal = document.querySelector('#main-book-goal p').textContent;
    const currentGoalHtml = document.getElementById('main-book-goal').innerHTML;
    document.getElementById('session-goal-display').innerHTML = currentGoalHtml;
    
    switchStep(1);

    // 이벤트 리스너 (람다 함수 대신 고유 함수를 사용해 중복 방지)
    const onNextStepClick = (e) => {
        handleNextStep(parseInt(e.target.dataset.next, 10));
    };
    
    const onBackClick = () => {
        if (confirm("세션을 중단하고 이전 화면으로 돌아가시겠습니까?")) {
            const event = new CustomEvent('sessionComplete', { detail: { finished: false } });
            document.dispatchEvent(event);
        }
    };

    const onFinishClick = () => {
        state.userInputs.finalWriting = document.getElementById('final-writing-input').value;
        
        if (!state.userInputs.finalWriting.trim()) {
            alert('체화 글쓰기를 작성해야 캡슐을 봉인할 수 있습니다.');
            return;
        }

        plantNewCapsule();
        const event = new CustomEvent('sessionComplete', { detail: { finished: true } });
        document.dispatchEvent(event);
    };

    // 기존 리스너 제거 후 새로 추가
    document.querySelectorAll('#metis-session .next-step-btn').forEach(btn => {
        btn.removeEventListener('click', onNextStepClick);
        btn.addEventListener('click', onNextStepClick);
    });
    const backBtn = document.getElementById('back-to-dashboard-btn');
    backBtn.removeEventListener('click', onBackClick);
    backBtn.addEventListener('click', onBackClick);
    
    const finishBtn = document.getElementById('finish-session-btn');
    finishBtn.removeEventListener('click', onFinishClick);
    finishBtn.addEventListener('click', onFinishClick);
}

export function handleSessionCompletion() {
    resetSession();
}
