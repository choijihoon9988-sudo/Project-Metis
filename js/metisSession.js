// js/metisSession.js
import { UI } from './ui.js';
import { geminiModel } from './api.js';
import { Refinement } from './refinement.js'; // 지식 정제소 모듈 임포트

// 코스별 '전략적 고정값' 시간표 (단위: 초)
const COURSE_PRESETS = {
    15: { reading: [300], breaks: [], prediction: 120, writing: 120 }, // 독서 5분, 예측 2분, 나머지 2분
    30: { reading: [900], breaks: [], prediction: 180, writing: 180 }, // 독서 15분, 예측 3분, 나머지 3분
    45: { reading: [1500], breaks: [300], prediction: 180, writing: 180 }, // 독서 25분, 휴식 5분, 예측 3분, 나머지 3분
    60: { reading: [1500, 900], breaks: [300], prediction: 180, writing: 180 }, // 독서 25분+15분, 휴식 5분, 예측 3분, 나머지 3분
    90: { reading: [1500, 1500, 660], breaks: [300, 300], prediction: 180, writing: 240 }, // 독서 25+25+11분, 휴식 5+5분, 예측 3분, 나머지 4분
    120: { reading: [1500, 1500, 1500, 420], breaks: [300, 300, 300], prediction: 180, writing: 300 } // 독서 25*3+7분, 휴식 5*3분, 예측 3분, 나머지 5분
};

const AI = {
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
    state: {},
    stepSequence: [], // 동적으로 생성됨
    initialState: {
        currentStepId: 'step-1',
        currentStepIndex: 0,
        userInputs: { prediction: '', brainDump: '', aiPrediction: '', gap: '', finalWriting: '' },
        timerInterval: null,
        timePreset: null,
        clippings: [], // 클리핑을 저장할 배열 추가
        currentBook: {}, // 현재 책 정보를 저장할 객체 추가
    },

    init() {
        this.reset();
        const selectedCourse = document.querySelector('.course-btn.active');
        const totalMinutes = selectedCourse ? parseInt(selectedCourse.dataset.duration, 10) : 30;
        this.state.timePreset = COURSE_PRESETS[totalMinutes];
        this.state.currentBook = {
            title: document.getElementById('main-book-title').textContent,
            cover: document.getElementById('main-book-cover').src,
        };
        this.buildStepSequence();

        document.getElementById('session-goal-display').innerHTML = document.getElementById('main-book-goal').innerHTML;
        this.handleStepLogic(this.state.currentStepId);

        // '심화 예측' 버튼 이벤트 리스너 설정
        const deepPredictionBtn = document.getElementById('deepen-prediction-btn');
        deepPredictionBtn.onclick = () => {
             const newTime = parseInt(deepPredictionBtn.dataset.time, 10);
             this.startTimer(newTime, 'timer-step-1');
             UI.showToast(`심화 예측 모드 시작! (${newTime / 60}분)`, 'success');
             deepPredictionBtn.parentElement.style.display = 'none'; // 버튼 숨기기
        };
    },

    buildStepSequence() {
        const sequence = ['step-1'];
        const readingCount = this.state.timePreset.reading.length;
        for (let i = 0; i < readingCount; i++) {
            sequence.push(`step-2`); // 독서 단계
            if (this.state.timePreset.breaks[i]) {
                sequence.push(`step-2-break`); // 휴식 단계
            }
        }
        sequence.push('step-3', 'step-4', 'step-5', 'step-6', 'step-7');
        this.stepSequence = sequence;
    },

    reset() {
        clearInterval(this.state.timerInterval);
        this.state = JSON.parse(JSON.stringify(this.initialState));
    },
    
    startTimer(duration, elementId) {
        clearInterval(this.state.timerInterval);
        let timeLeft = duration;
        UI.updateTimer(timeLeft, elementId);

        this.state.timerInterval = setInterval(() => {
            timeLeft--;
            UI.updateTimer(timeLeft, elementId);
            if (timeLeft <= 0) {
                clearInterval(this.state.timerInterval);
            }
        }, 1000);
    },

    async handleStepLogic(stepId) {
        this.state.currentStepId = stepId;
        UI.switchStep(stepId);
        
        const { timePreset } = this.state;
        const writingTime = timePreset.writing;

        switch (stepId) {
            case 'step-1':
                this.startTimer(timePreset.prediction, 'timer-step-1');
                const totalMinutes = Object.keys(COURSE_PRESETS).find(key => COURSE_PRESETS[key] === timePreset);
                document.getElementById('prediction-options').style.display = totalMinutes >= 60 ? 'block' : 'none';
                break;
            case 'step-2':
                const readingIndex = this.stepSequence.slice(0, this.state.currentStepIndex + 1).filter(s => s === 'step-2').length - 1;
                this.startTimer(timePreset.reading[readingIndex], 'timer-step-2');
                break;
            case 'step-2-break':
                const breakIndex = this.stepSequence.slice(0, this.state.currentStepIndex + 1).filter(s => s === 'step-2-break').length - 1;
                this.startTimer(timePreset.breaks[breakIndex], 'timer-step-2-break');
                break;
            case 'step-3': this.startTimer(writingTime, `timer-${stepId}`); break;
            case 'step-4': this.startTimer(writingTime, `timer-${stepId}`); break;
            case 'step-6': this.startTimer(writingTime, `timer-${stepId}`); break;
            case 'step-7': this.startTimer(writingTime, `timer-${stepId}`); break;
            case 'step-5':
                await this.runComparisonAnalysis();
                break;
        }
    },

    proceed() {
        const currentId = this.state.currentStepId;
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

        if (this.state.currentStepIndex < this.stepSequence.length - 1) {
            this.state.currentStepIndex++;
            const nextStepId = this.stepSequence[this.state.currentStepIndex];
            this.handleStepLogic(nextStepId);
        } else {
            this.complete();
        }
    },

    async runComparisonAnalysis() {
        UI.showLoader(true, "AI가 분석 중입니다...");
        const { brainDump, aiPrediction } = this.state.userInputs;
        const goal = document.querySelector('#session-goal-display p').textContent;

        const [feedback, summary] = await Promise.all([
            AI.getAIFeedback(brainDump),
            AI.getExpertSummary(goal)
        ]);
        
        UI.renderComparison({
            myThoughts: brainDump,
            aiFeedback: feedback,
            myPrediction: aiPrediction,
            expertSummary: summary
        });

        UI.showLoader(false);
    },

    async complete() {
        clearInterval(this.state.timerInterval);
        const finalWriting = document.getElementById('final-writing-input').value;

        if (!finalWriting.trim()) {
            UI.showToast('체화 글쓰기를 작성해야 합니다!', 'error');
            return;
        }
        this.state.userInputs.finalWriting = finalWriting;

        // 세션 완료 시, 정제소로 클리핑 데이터 전송
        await Refinement.startRefinement(this.state.clippings, this.state.currentBook);
        
        UI.showToast(`'${this.state.currentBook.title}'에 대한 ${this.state.clippings.length}개의 지식 조각이 정제소로 이동했습니다.`, 'success');
        
        document.dispatchEvent(new CustomEvent('sessionComplete', {
            detail: { finished: true }
        }));
    },

    addClipping(text) {
        if(text.trim()) {
            this.state.clippings.push(text);
            UI.showToast(`클리핑 추가 완료! (현재 ${this.state.clippings.length}개)`, 'success');
        }
    }
};