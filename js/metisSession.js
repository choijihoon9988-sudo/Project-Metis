// js/metisSession.js
// '메티스 세션'의 7단계 학습 사이클 로직을 관리하며,
// 세션 완료 시 '지식 식물' 데이터를 생성합니다.

import { UI } from './ui.js';
// 실제 AI 모델을 api.js에서 가져옵니다.
import { geminiModel } from './api.js';

// 이 모듈은 AI와의 통신을 시뮬레이션합니다.
const AI = {
    // 사용자의 '생각 기록'을 바탕으로 피드백을 생성합니다.
    async getAIFeedback(text) {
        if (!text || text.trim().length < 10) {
            return "기록된 내용이 너무 적어 분석하기 어렵습니다. 좀 더 자세히 생각을 기록해주세요.";
        }
        const prompt = `다음은 사용자가 책의 특정 주제에 대해 학습하고 기록한 내용입니다. 이 내용을 분석하여, 사용자의 이해를 더 깊게 만들어 줄 핵심적인 피드백을 한두 문장으로 제공해주세요. 긍정적인 면을 먼저 언급한 후, 개선점을 부드럽게 제안하는 방식으로 작성해주세요.\n\n[사용자 기록]\n${text}`;
        
        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("AI Feedback 생성 오류:", error);
            return "AI 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
    },

    // 현재 목표에 대한 전문가 요약을 생성합니다.
    async getExpertSummary(goalText) {
        const prompt = `다음 학습 목표에 대한 전문가 수준의 핵심 요약을 2~3문장으로 제공해주세요. 가장 중요한 개념과 그 의미를 중심으로 설명해주세요.\n\n[학습 목표]\n${goalText}`;
        try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Expert Summary 생성 오류:", error);
            return "전문가 요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
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
                                   key === 'step-4' ? 'aiPrediction' : 'prediction';
                this.state.userInputs[mappedKey] = inputEl.value;
            }
        }

        const currentIndex = this.stepSequence.indexOf(currentId);
        if (currentIndex < this.stepSequence.length - 1) {
            const nextStepId = this.stepSequence[currentIndex + 1];
            this.handleStepLogic(nextStepId);
        } else {
            this.complete();
        }
    },

    /**
     * 5단계 '비교 분석'을 위해 AI 피드백과 전문가 요약을 요청하고 화면에 표시합니다.
     */
    async runComparisonAnalysis() {
        UI.showLoader(true, "AI가 분석 중입니다...");
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

        UI.showLoader(false);
    },

    /**
     * 세션을 최종 완료하고 'sessionComplete' 이벤트를 발생시킵니다.
     */
    complete() {
        clearInterval(this.state.timerInterval);
        const finalWriting = document.getElementById('final-writing-input').value;

        if (!finalWriting.trim()) {
            UI.showToast('체화 글쓰기를 작성해야 씨앗을 심을 수 있습니다!', 'error');
            this.state.currentStepId = 'step-7'; 
            return;
        }
        this.state.userInputs.finalWriting = finalWriting;

        document.dispatchEvent(new CustomEvent('sessionComplete', {
            detail: {
                finished: true,
                data: this.state.userInputs
            }
        }));
    }
};