// js/metisSession.js
// '메티스 세션'의 7단계 학습 사이클 로직을 관리하며,
// 세션 완료 시 '지식 식물' 데이터를 생성합니다.

import { UI } from './ui.js';

// 이 모듈은 AI와의 통신을 시뮬레이션합니다.
const AI = {
    // 가짜 API 호출을 시뮬레이션하는 함수
    simulateApi: (data, delay = 800) => new Promise(res => setTimeout(() => res(data), delay)),

    // 사용자의 '생각 기록'을 바탕으로 피드백을 생성합니다.
    getAIFeedback(text) {
        if (!text || text.trim().length < 10) {
            return this.simulateApi("기록된 내용이 너무 적어 분석하기 어렵습니다. 좀 더 자세히 생각을 기록해주세요.");
        }
        return this.simulateApi("사용자의 기록을 분석한 결과, 핵심 개념은 파악했으나 각 요소 간의 유기적 '연결성'에 대한 설명이 부족합니다. 각 개념이 어떻게 서로 영향을 주는지 설명하면 이해도가 더 깊어질 것입니다.");
    },

    // 현재 목표에 대한 전문가 요약을 생성합니다.
    getExpertSummary(goalText) {
        // 실제로는 목표 텍스트를 분석해야 하지만, 지금은 시뮬레이션합니다.
        return this.simulateApi(" **넛지(Nudge):** 인간은 체계적으로 편향되어 있으며, '선택 설계'를 통해 더 나은 결정을 내리도록 부드럽게 개입할 수 있다. 핵심은 강압이 아닌 유연한 유도에 있다.");
    }
};


export const MetisSession = {
    state: {}, // 현재 세션의 상태 (진행 단계, 사용자 입력 등)
    stepSequence: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6', 'step-7'],
    initialState: {
        currentStepId: 'step-1',
        userInputs: { prediction: '', brainDump: '', aiPrediction: '', gap: '', finalWriting: '' },
        timerInterval: null,
        readingDuration: 1800, // 기본값 30분 (초 단위)
    },

    /**
     * 메티스 세션을 초기화하고 시작합니다.
     */
    init() {
        this.reset();
        const selectedCourse = document.querySelector('.course-btn.active');
        const totalMinutes = selectedCourse ? parseInt(selectedCourse.dataset.duration, 10) : 30;
        this.state.readingDuration = totalMinutes * 60; // 선택된 시간을 초 단위로 저장

        // 대시보드의 현재 목표를 세션 목표로 복사해옵니다.
        document.getElementById('session-goal-display').innerHTML = document.getElementById('main-book-goal').innerHTML;
        this.handleStepLogic(this.state.currentStepId);
    },

    /**
     * 세션 상태를 초기화합니다.
     */
    reset() {
        clearInterval(this.state.timerInterval);
        this.state = JSON.parse(JSON.stringify(this.initialState));
    },
    
    /**
     * 타이머를 시작합니다.
     * @param {number} duration - 타이머 시간 (초)
     * @param {string} elementId - 타이머를 표시할 HTML 요소의 ID
     */
    startTimer(duration, elementId) {
        clearInterval(this.state.timerInterval);
        let timeLeft = duration;
        UI.updateTimer(timeLeft, elementId); // UI 업데이트 요청

        this.state.timerInterval = setInterval(() => {
            timeLeft--;
            UI.updateTimer(timeLeft, elementId);
            if (timeLeft <= 0) {
                clearInterval(this.state.timerInterval);
                // 시간이 끝나도 자동으로 넘어가지 않음
            }
        }, 1000);
    },

    /**
     * 현재 단계에 맞는 로직을 처리합니다.
     * @param {string} stepId - 처리할 단계의 ID
     */
    async handleStepLogic(stepId) {
        this.state.currentStepId = stepId;
        UI.switchStep(stepId); // UI에 화면 전환 요청

        const WRITING_DURATION = 300; // 모든 글쓰기 시간은 5분(300초)으로 고정

        switch (stepId) {
            case 'step-1':
            case 'step-3':
            case 'step-4':
            case 'step-6':
            case 'step-7':
                this.startTimer(WRITING_DURATION, `timer-${stepId}`);
                break;
            
            case 'step-2':
                this.startTimer(this.state.readingDuration, 'timer-step-2');
                break;
            
            case 'step-5':
                // 타이머 없이 바로 분석 실행
                await this.runComparisonAnalysis();
                break;
        }
    },

    /**
     * 다음 단계로 진행합니다. (오직 버튼 클릭 시에만 호출)
     */
    proceed() {
        const currentId = this.state.currentStepId;

        // 현재 단계의 사용자 입력을 state에 저장
        const inputIdMap = {
            'step-1': 'prediction', 'step-3': 'braindump', 'step-4': 'ai-prediction',
            'step-6': 'gap', 'step-7': 'final-writing'
        };
        const key = Object.keys(inputIdMap).find(k => k === currentId);
        if (key) {
            const inputEl = document.getElementById(`${inputIdMap[key]}-input`);
            if (inputEl) {
                 const mappedKey = key === 'step-3' ? 'brainDump' : 
                                   key === 'step-7' ? 'finalWriting' : 
                                   key === 'step-4' ? 'aiPrediction' : key;
                this.state.userInputs[mappedKey] = inputEl.value;
            }
        }

        const currentIndex = this.stepSequence.indexOf(currentId);
        if (currentIndex < this.stepSequence.length - 1) {
            const nextStepId = this.stepSequence[currentIndex + 1];
            this.handleStepLogic(nextStepId);
        } else {
            // 마지막 단계에서는 '완료' 버튼이 별도로 complete()를 호출하므로 여기서는 처리하지 않음
            this.complete();
        }
    },

    /**
     * 5단계 '비교 분석'을 위해 AI 피드백과 전문가 요약을 요청하고 화면에 표시합니다.
     */
    async runComparisonAnalysis() {
        UI.showLoader(true, "AI가 분석 중입니다..."); // 로딩 화면 표시
        const { brainDump, aiPrediction } = this.state.userInputs;
        const goal = document.querySelector('#session-goal-display p').textContent;

        // AI 피드백과 전문가 요약을 동시에 요청 (병렬 처리)
        const [feedback, summary] = await Promise.all([
            AI.getAIFeedback(brainDump),
            AI.getExpertSummary(goal)
        ]);
        
        // UI 모듈에 렌더링 요청
        UI.renderComparison({
            myThoughts: brainDump,
            aiFeedback: feedback,
            myPrediction: aiPrediction,
            expertSummary: summary
        });

        UI.showLoader(false); // 로딩 화면 숨김
    },

    /**
     * 세션을 최종 완료하고 'sessionComplete' 이벤트를 발생시킵니다.
     */
    complete() {
        clearInterval(this.state.timerInterval);
        const finalWriting = document.getElementById('final-writing-input').value;

        if (!finalWriting.trim()) {
            UI.showToast('체화 글쓰기를 작성해야 씨앗을 심을 수 있습니다!', 'error');
            // 마지막 단계에 머무르도록 ID를 다시 설정
            this.state.currentStepId = 'step-7'; 
            return;
        }
        this.state.userInputs.finalWriting = finalWriting;

        // main.js가 받을 수 있도록 커스텀 이벤트를 발생시킴
        document.dispatchEvent(new CustomEvent('sessionComplete', {
            detail: {
                finished: true,
                data: this.state.userInputs // 최종 결과물 전달
            }
        }));
    }
};