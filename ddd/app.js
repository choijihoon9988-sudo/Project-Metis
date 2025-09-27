// --- Dummy Data for Simulation ---
// In the future, this data will be fetched from APIs like Google Books and Firebase.
const DUMMY_BOOKS = {
    "넛지": { title: "넛지 (Nudge)", author: "리처드 H. 탈러, 캐스 R. 선스타인", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1593003033l/54495910.jpg" },
    "사피엔스": { title: "사피엔스", author: "유발 하라리", cover: "https://image.aladin.co.kr/product/30883/29/cover500/k252830635_1.jpg" },
    "클린 코드": { title: "클린 코드", author: "로버트 C. 마틴", cover: "https://image.aladin.co.kr/product/1324/3/cover500/890120935x_1.jpg" }
};

const DUMMY_TOC = {
    "넛지 (Nudge)": [
        { part: "1부: 인간은 왜 실수를 반복하는가?", chapters: ["기준점 설정의 함정", "손실 회피 편향"] },
        { part: "2부: 더 나은 선택을 이끄는 힘, 넛지", chapters: ["디폴트", "피드백과 오류 예상"] }
    ],
    "사피엔스": [
        { part: "1부: 인지 혁명", chapters: ["허구의 탄생", "수다쟁이 유인원"] },
        { part: "4부: 과학 혁명", chapters: ["무지의 발견", "자본주의 교리"] }
    ],
    "클린 코드": [
        { part: "1부: 클린 코드", chapters: ["의미 있는 이름", "함수"] },
        { part: "2부: 클린 코드 실천", chapters: ["클래스", "오류 처리"] }
    ]
};

const DUMMY_QUESTS = {
    "기준점 설정의 함정": [
        { level: 1, type: "개념 분석", text: "이 챕터의 핵심 개념인 '기준점 설정(Anchoring)'이 무엇인지, 책의 사례를 들어 3문장으로 설명하기" },
        { level: 2, type: "실용 적용", text: "최근 내가 경험한 쇼핑 상황에서 '기준점 설정'이 어떻게 활용되었는지 구체적인 사례를 찾아 분석하기" },
        { level: 3, type: "비판적 사고", text: "'기준점 설정'을 악용하여 소비자를 현혹하는 마케팅 사례를 찾고, 그에 대한 대응 방안을 제시하기" }
    ],
    "허구의 탄생": [
        { level: 1, type: "개념 분석", text: "'허구'가 사피엔스에게 어떤 결정적 이점을 주었는지 책의 내용을 바탕으로 요약하기" },
        { level: 2, type: "실용 적용", text: "현대 사회(예: 국가, 화폐, 법인)에서 작동하는 '허구'의 사례 3가지를 찾아 설명하기" },
        { level: 3, type: "비판적 사고", text: "저자의 주장처럼 '허구'가 인류 발전의 원동력이었다면, 그로 인한 가장 큰 부작용은 무엇이었을지 논하기" }
    ],
     "의미 있는 이름": [
        { level: 1, type: "개념 분석", text: "좋은 이름의 원칙(예: 의도를 밝혀라, 발음하기 쉬운 이름을 사용하라) 3가지를 요약하세요." },
        { level: 2, type: "실용 적용", text: "자신이 최근 작성한 코드에서 이름이 부적절하다고 생각되는 변수나 함수 3개를 찾아 더 나은 이름으로 리팩토링하세요." },
        { level: 3, type: "비판적 사고", text: "책에서 제안하는 명명 규칙이 모든 프로그래밍 언어나 프로젝트 환경에 항상 최선일까요? 예외적인 상황을 제시하고 그 이유를 설명하세요." }
    ]
};

// --- UI Module: Manages all DOM manipulations ---
const UI = {
    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewName)?.classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
    },
    updateTimer(timeLeft, elementId) {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        const timerEl = document.getElementById(elementId);
        if (timerEl) {
            timerEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    },
    updateProgress(progress) {
        const el = document.getElementById('session-progress');
        if (el) el.innerHTML = progress;
    },
    showLoader(show, text = "AI가 분석 중입니다...") {
         const loader = document.getElementById('loader');
         loader.querySelector('.loader-text').textContent = text;
         loader.style.display = show ? 'flex' : 'none';
    },
    showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    },
    showConfirm(msg, onConfirm) {
        const ov = document.createElement('div');
        ov.className = 'modal-overlay';
        ov.style.display = 'flex';
        const md = document.createElement('div');
        md.className = 'modal-content';
        md.innerHTML = `<div class="modal-body"><p>${msg}</p></div><div class="modal-controls"><button id="c-cancel" class="btn">취소</button><button id="c-ok" class="btn btn-primary">확인</button></div>`;
        ov.appendChild(md);
        document.body.appendChild(ov);
        ov.addEventListener('click', e => {
            if (e.target.id === 'c-ok') onConfirm();
            if (e.target.closest('#c-cancel') || e.target.closest('#c-ok') || e.target === ov) {
                ov.remove();
            }
        });
    },
    BookExplorer: {
        overlay: document.getElementById('book-explorer-modal-overlay'),
        content: document.getElementById('book-explorer-modal'),
        show() { this.overlay.style.display = 'flex'; },
        hide() { this.overlay.style.display = 'none'; },
        render(step, data) {
            let html = '';
            switch (step) {
                case 'search':
                    html = `<div class="modal-header"><h3>AI 도서 탐색기</h3><p>어떤 책을 탐험하시겠어요?</p></div>
                            <div class="modal-body">
                              <input type="text" id="book-search-input" placeholder="책 제목을 입력하세요...">
                              <div id="book-search-results"></div>
                            </div>`;
                    break;
                case 'results':
                    html = (data.results.length > 0 ? data.results.map(book => `
                        <div class="book-result-card" data-title="${book.title}">
                            <img src="${book.cover}" alt="${book.title}">
                        </div>`).join('') : '<p style="text-align:center; color: var(--text-light-color);">검색 결과가 없습니다.</p>');
                    break;
                case 'confirmation':
                    html = `<div id="book-explorer-confirmation" class="modal-body">
                                <img src="${data.cover}" alt="${data.title}">
                                <h4>${data.title}</h4>
                                <p>${data.author}</p>
                            </div>
                            <div class="modal-controls">
                                <button id="book-explorer-back-btn" class="btn">다시 검색</button>
                                <button id="book-explorer-confirm-btn" class="btn btn-primary">새로운 학습 퀘스트 받기</button>
                            </div>`;
                    break;
            }
            if (step === 'results') {
                const resultsEl = this.content.querySelector('#book-search-results');
                if(resultsEl) resultsEl.innerHTML = html;
            } else {
                this.content.innerHTML = html;
            }
        }
    },
    GoalNavigator: {
        overlay: document.getElementById('goal-navigator-modal-overlay'),
        content: document.getElementById('goal-navigator-modal'),
        show() { this.overlay.style.display = 'flex'; },
        hide() { this.overlay.style.display = 'none'; },
        render(step, data) {
            let html = '';
            switch (step) {
                case 'toc':
                    html = `<div class="modal-header"><h3>탐험 지도: ${data.bookTitle}</h3><p>오늘 학습할 영역(챕터)을 선택하세요.</p></div>
                            <div class="modal-body" id="toc-container">
                                ${data.toc.length > 0 ? data.toc.map(part => `
                                    <div class="toc-item">
                                        <div class="toc-title"><span>${part.part}</span><span>▼</span></div>
                                        <div class="toc-chapters">
                                            ${part.chapters.map(ch => `<div class="toc-chapter">${ch}</div>`).join('')}
                                        </div>
                                    </div>
                                `).join('') : '<p style="text-align:center;">이 책의 목차 정보를 불러올 수 없습니다.</p>'}
                            </div>`;
                    break;
                case 'quests':
                    html = `<div class="modal-header"><h3>학습 퀘스트 제안</h3><p><strong>${data.chapter}</strong> 챕터에 대한 퀘스트입니다.</p></div>
                            <div class="modal-body quest-selection-grid">
                                ${data.quests.length > 0 ? data.quests.map(q => `
                                    <div class="quest-card" data-level="${q.level}" data-text="${q.text}">
                                        <h5>${q.type} (Lv.${q.level})</h5>
                                        <p>${q.text}</p>
                                    </div>
                                `).join('') : '<p style="text-align:center;">이 챕터에 대한 추천 퀘스트가 없습니다.</p>'}
                            </div>
                            <div class="modal-controls">
                              <button id="goal-quests-back-btn" class="btn">챕터 다시 선택</button>
                            </div>`;
                    break;
                case 'editor':
                     html = `<div class="modal-header"><h3>✅ 퀘스트 확정</h3><p>AI 제안 퀘스트를 수정하여 확정하세요.</p></div>
                             <div class="modal-body"><textarea id="architect-goal-editor">${data.text}</textarea></div>
                             <div class="modal-controls">
                                <button id="goal-editor-back-btn" class="btn">퀘스트 다시 선택</button>
                                <button id="architect-confirm-goal" class="btn btn-primary">이 목표로 탐험 시작</button>
                             </div>`;
                    break;
            }
            this.content.innerHTML = html;
        }
    },
    renderGarden(plants) {
        const container = document.getElementById('garden-container');
        container.innerHTML = '';
        if (plants.length === 0) {
            container.innerHTML = `<p class="empty-message">아직 정원에 식물이 없습니다. 메티스 세션을 통해 첫 씨앗을 심어보세요!</p>`;
            return;
        }
        plants.sort((a, b) => a.daysUntilReview - b.daysUntilReview).forEach(plant => {
            const el = document.createElement('div');
            el.className = `plant-card ${plant.status}`;
            el.dataset.id = plant.id;
            const reviewText = plant.daysUntilReview <= 0 ? (plant.daysUntilReview === 0 ? '오늘 복습!' : `${-plant.daysUntilReview}일 지남!`) : `복습까지 ${plant.daysUntilReview}일`;
            el.innerHTML = `<div class="plant-title">${plant.title}</div><div class="plant-source">${plant.sourceBook}</div><div class="plant-status">${reviewText}</div>`;
            container.appendChild(el);
        });
    },
    Dashboard: {
        overlay: document.getElementById('dashboard-modal-overlay'),
        content: document.getElementById('dashboard-modal-content'),
        chart: null,
        show(plant, chartConfig) {
            this.content.innerHTML = `
                <div class="modal-header">
                    <h3>"${plant.title}" 기억 곡선</h3>
                    <p>출처: ${plant.sourceBook}</p>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 250px; gap: 24px;">
                    <div class="chart-container" style="position: relative; height: 350px;">
                        <canvas id="memoryCurveChart"></canvas>
                    </div>
                    <div class="analysis-panel">
                        <h4>상태 분석</h4>
                        <p>현재 이 지식은 '<strong>${plant.memoryStage}</strong>' 상태입니다. 기억 강도는 <strong>${plant.strength}</strong>입니다.</p>
                        <hr style="margin: 16px 0;">
                        <h4>시뮬레이션</h4>
                        <p>지금 복습하면 미래의 기억 곡선이 어떻게 변할까요?</p>
                        <button id="simulate-review-btn" class="btn btn-primary" style="width: 100%; margin-top: 8px;">오늘 복습 시뮬레이션</button>
                    </div>
                </div>`;
            
            const chartCanvas = this.content.querySelector('#memoryCurveChart');
            if (this.chart) this.chart.destroy();
            this.chart = new Chart(chartCanvas, chartConfig);
            
            this.overlay.style.display = 'flex';
        },
        hide() { this.overlay.style.display = 'none'; },
        updateChart(newData) {
            if (!this.chart) return;
            const existingSimIndex = this.chart.data.datasets.findIndex(d => d.label.includes('시뮬레이션'));
            if(existingSimIndex > -1) this.chart.data.datasets.splice(existingSimIndex, 1);
            this.chart.data.datasets.push(newData);
            this.chart.update();
        }
    },
    Challenge: {
        overlay: document.getElementById('challenge-modal-overlay'),
        content: document.getElementById('challenge-modal'),
        show(challenge, onComplete) {
            let challengeHTML = '';
            switch (challenge.type) {
                case 'connect':
                    challengeHTML = `<h3 class="challenge-title">챌린지 Lv.2: 사례 연결</h3> <p class="challenge-description">이 지식을 설명할 수 있는 최근 뉴스 기사나 당신의 개인적인 경험 한 가지를 제시하세요.</p>`;
                    break;
                case 'critique':
                    challengeHTML = `<h3 class="challenge-title">챌린지 Lv.3: 비판적 사고</h3> <p class="challenge-description">이 지식의 한계점이나 잠재적인 반론은 무엇일까요?</p>`;
                    break;
                default:
                    challengeHTML = `<h3 class="challenge-title">챌린지 Lv.1: 핵심 내용 인출</h3> <p class="challenge-description">"${challenge.sourceBook}"에서 배운 내용을 떠올려보세요.</p>`;
                    break;
            }
            this.content.innerHTML = `
                <div class="modal-body">
                    ${challengeHTML}
                    <div class="challenge-prompt" style="background-color: var(--background-color); border-left: 4px solid var(--primary-color); padding: 16px; margin: 24px 0; border-radius: 4px; font-style: italic;">${challenge.question.replace(/\n/g, '<br>')}</div>
                    <textarea id="challenge-answer" placeholder="당신의 언어로 자유롭게 설명해보세요..."></textarea>
                    <div class="confidence-rating" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                        <p>이번 답변에 얼마나 확신했나요?</p>
                        <div class="confidence-buttons" style="display:flex; gap: 8px; margin-top: 8px;">
                            <button class="btn" data-confidence="confident">✅ 확신함</button>
                            <button class="btn" data-confidence="unsure">🤔 긴가민가함</button>
                            <button class="btn" data-confidence="guess">❓ 거의 추측함</button>
                        </div>
                    </div>
                </div>
                <div class="modal-controls">
                    <button id="challenge-cancel-btn" class="btn">취소</button>
                    <button id="challenge-submit-btn" class="btn btn-primary" disabled>복습 완료</button>
                </div>`;
            this.overlay.style.display = 'flex';
            
            let selectedConfidence = null;
            const clickHandler = (e) => {
                const target = e.target;
                if(target.closest('.confidence-buttons .btn')){
                    this.content.querySelectorAll('.confidence-buttons .btn').forEach(b => b.classList.remove('active'));
                    target.closest('.btn').classList.add('active');
                    selectedConfidence = target.closest('.btn').dataset.confidence;
                    this.content.querySelector('#challenge-submit-btn').disabled = false;
                } else if (target.id === 'challenge-cancel-btn' || target.id === 'challenge-submit-btn'){
                    if (target.id === 'challenge-submit-btn' && selectedConfidence) {
                        onComplete(selectedConfidence);
                    }
                    this.hide(clickHandler);
                }
            };
            this.content.addEventListener('click', clickHandler, { once: true });
        },
        hide(handler) { 
            if(this.overlay) this.overlay.style.display = 'none'; 
        }
    }
};

// --- Book Explorer Module ---
const BookExplorer = {
    state: {},
    init() {
        this.state = { selectedBook: null };
        UI.BookExplorer.render('search');
        UI.BookExplorer.show();
        this.addEventListeners();
    },
    addEventListeners() {
        const content = UI.BookExplorer.content;
        content.removeEventListener('click', this.handleEvents.bind(this));
        content.removeEventListener('input', this.handleSearch.bind(this));
        content.addEventListener('input', this.handleSearch.bind(this));
        content.addEventListener('click', this.handleEvents.bind(this));
    },
    handleSearch(e) {
        if (e.target.id !== 'book-search-input') return;
        const query = e.target.value.toLowerCase();
        const results = Object.keys(DUMMY_BOOKS)
            .filter(key => key.toLowerCase().includes(query))
            .map(key => DUMMY_BOOKS[key]);
        UI.BookExplorer.render('results', { results });
    },
    handleEvents(e) {
        const resultCard = e.target.closest('.book-result-card');
        if (resultCard) {
            const title = resultCard.dataset.title;
            const titleKey = Object.keys(DUMMY_BOOKS).find(key => DUMMY_BOOKS[key].title === title);
            this.state.selectedBook = DUMMY_BOOKS[titleKey];
            UI.BookExplorer.render('confirmation', this.state.selectedBook);
            return;
        }
        if (e.target.id === 'book-explorer-back-btn') {
            UI.BookExplorer.render('search');
            return;
        }
        if (e.target.id === 'book-explorer-confirm-btn') {
            document.dispatchEvent(new CustomEvent('bookSelected', { detail: this.state.selectedBook }));
            UI.BookExplorer.hide();
            GoalNavigator.init(this.state.selectedBook.title);
        }
    }
};

// --- Goal Navigator Module ---
const GoalNavigator = {
    state: {},
    init(bookTitle) {
        this.state = { bookTitle, selectedChapter: null, selectedQuest: null };
        const content = UI.GoalNavigator.content;
        content.removeEventListener('click', this.handleEvents.bind(this));
        content.addEventListener('click', this.handleEvents.bind(this));
        this.renderTOC();
        UI.GoalNavigator.show();
    },
    renderTOC() {
        const toc = DUMMY_TOC[this.state.bookTitle] || [];
        UI.GoalNavigator.render('toc', { bookTitle: this.state.bookTitle, toc });
    },
    handleEvents(e) {
        const tocTitle = e.target.closest('.toc-title');
        if (tocTitle) {
            const chapters = tocTitle.nextElementSibling;
            const isOpening = chapters.style.display !== 'block';
            chapters.style.display = isOpening ? 'block' : 'none';
            tocTitle.querySelector('span:last-child').textContent = isOpening ? '▲' : '▼';
            return;
        }
        const chapter = e.target.closest('.toc-chapter');
        if (chapter) {
            this.state.selectedChapter = chapter.textContent;
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render('quests', { chapter: this.state.selectedChapter, quests });
            return;
        }
        const questCard = e.target.closest('.quest-card');
        if (questCard) {
            this.state.selectedQuest = { level: questCard.dataset.level, text: questCard.dataset.text };
            UI.GoalNavigator.render('editor', this.state.selectedQuest);
            return;
        }
         if (e.target.id === 'goal-quests-back-btn') {
            this.renderTOC();
            return;
        }
        if (e.target.id === 'goal-editor-back-btn') {
            const quests = DUMMY_QUESTS[this.state.selectedChapter] || [];
            UI.GoalNavigator.render('quests', { chapter: this.state.selectedChapter, quests });
            return;
        }
        if (e.target.id === 'architect-confirm-goal') {
            this.state.selectedQuest.text = document.getElementById('architect-goal-editor').value;
            document.dispatchEvent(new CustomEvent('goalSelected', { detail: this.state.selectedQuest }));
            UI.GoalNavigator.hide();
        }
    }
};

// --- MetisSession Module ---
const MetisSession = {
    state: {},
    stepSequence: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6', 'step-7'],
    initialState: { 
        currentStepId: 'step-1', 
        userInputs: { prediction: '', brainDump: '', aiPrediction: '', gap: '', finalWriting: '' }, 
        timerInterval: null, 
        timeAllocations: {},
        cyclesCompleted: 0,
    },
    init() { 
        this.reset();
        const selectedCourse = document.querySelector('.course-btn.active');
        const totalMinutes = selectedCourse ? parseInt(selectedCourse.dataset.duration, 10) : 30;
        this.state.timeAllocations = this.calculateTimeAllocations(totalMinutes);
        document.getElementById('session-goal-display').innerHTML = document.getElementById('main-book-goal').innerHTML; 
        this.handleStepLogic(this.state.currentStepId);
    },
    reset() { 
        clearInterval(this.state.timerInterval); 
        this.state = JSON.parse(JSON.stringify(this.initialState)); 
    },
    calculateTimeAllocations(totalMinutes) {
        const allocations = { focusSessions: [], breakSessions: [], writing: {} };
        const presets = {
            15:  { 'step-1': 1, 'step-3': 3, 'step-4': 2, 'step-6': 2, 'step-7': 7 },
            30:  { 'step-1': 2, 'step-3': 5, 'step-4': 3, 'step-6': 5, 'step-7': 10 },
            45:  { 'step-1': 4, 'step-3': 6, 'step-4': 3, 'step-6': 5, 'step-7': 12 },
            60:  { 'step-1': 5, 'step-3': 7, 'step-4': 3, 'step-6': 5, 'step-7': 15 },
            90:  { 'step-1': 7, 'step-3': 7, 'step-4': 3, 'step-6': 5, 'step-7': 20 },
            120: { 'step-1': 10, 'step-3': 10, 'step-4': 3, 'step-6': 5, 'step-7': 25 }
        };
        const preset = presets[totalMinutes] || presets[30];
        let writingTotal = 0;
        for (const step in preset) {
            allocations.writing[step] = preset[step] * 60;
            writingTotal += preset[step];
        }
        let remainingMinutes = totalMinutes - writingTotal;
        if (remainingMinutes > 0) {
            const fullCycles = Math.floor(remainingMinutes / 30);
            for (let i = 0; i < fullCycles; i++) {
                allocations.focusSessions.push(25);
                allocations.breakSessions.push(5);
            }
            remainingMinutes -= fullCycles * 30;
        }
        if (remainingMinutes > 0) {
            allocations.focusSessions.push(remainingMinutes);
        }
        if (allocations.focusSessions.length === 0 && totalMinutes - writingTotal > 0) {
            allocations.focusSessions.push(totalMinutes - writingTotal);
        }
        return allocations;
    },
    startTimer(duration, elementId, onComplete) {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        let timeLeft = duration;
        UI.updateTimer(timeLeft, elementId);
        this.state.timerInterval = setInterval(() => {
            timeLeft--;
            UI.updateTimer(timeLeft, elementId);
            if (timeLeft <= 0) {
                clearInterval(this.state.timerInterval);
                onComplete();
            }
        }, 1000);
    },
    async handleStepLogic(stepId) {
        this.state.currentStepId = stepId;
        document.querySelectorAll('#metis-session-view .step').forEach(s => s.classList.remove('active'));
        const nextStepEl = document.getElementById(stepId);
        if (nextStepEl) {
            nextStepEl.classList.add('active');
            document.getElementById('step-title').textContent = nextStepEl.querySelector('h4').textContent;
        }
        
        clearInterval(this.state.timerInterval);

        if (this.state.timeAllocations.writing[stepId]) {
            const duration = this.state.timeAllocations.writing[stepId];
            this.startTimer(duration, `timer-${stepId}`, () => this.proceed());
        } else if (stepId === 'step-2') {
            UI.updateProgress(this.generateProgressHTML());
            const duration = (this.state.timeAllocations.focusSessions[this.state.cyclesCompleted] || 0) * 60;
            if (duration > 0) this.startTimer(duration, 'timer', () => this.handleFocusEnd());
            else this.handleFocusEnd();
        } else if (stepId === 'step-break') {
            const duration = (this.state.timeAllocations.breakSessions[this.state.cyclesCompleted - 1] || 0) * 60;
            if (duration > 0) this.startTimer(duration, 'timer-break', () => this.handleBreakEnd());
            else this.handleBreakEnd();
        }
    },
    proceed() {
        const currentId = this.state.currentStepId;
        const inputIdMap = {'step-1': 'prediction', 'step-3': 'brainDump', 'step-4': 'aiPrediction', 'step-6': 'gap', 'step-7': 'finalWriting'};
        const key = inputIdMap[currentId];
        if (key) this.state.userInputs[key] = document.getElementById(`${key}-input`).value;
        
        const currentIndex = this.stepSequence.indexOf(currentId);
        
        if (currentId === 'step-5') {
            this.completeAnalysisAndProceed();
        } else {
            const nextStepId = this.stepSequence[currentIndex + 1];
            if (nextStepId) this.handleStepLogic(nextStepId);
        }
    },
    handleFocusEnd() {
        this.state.cyclesCompleted++;
        if (this.state.cyclesCompleted < this.state.timeAllocations.focusSessions.length) {
            if (this.state.timeAllocations.breakSessions.length >= this.state.cyclesCompleted) {
                 this.handleStepLogic('step-break');
            } else {
                 this.handleStepLogic('step-2');
            }
        } else {
            UI.showToast("모든 집중 세션 완료! 생각을 기록하세요.", "success");
            this.handleStepLogic('step-3');
        }
    },
     handleBreakEnd() {
        UI.showToast("휴식 종료! 다음 세션을 시작합니다.", "success");
        this.handleStepLogic('step-2');
    },
    generateProgressHTML(){
        const totalCycles = this.state.timeAllocations.focusSessions.length;
        if (totalCycles === 0) return '읽기 시간 없음. 바로 기록으로 넘어갑니다.';
        let html = '';
        for(let i = 0; i < totalCycles; i++){
            html += (i < this.state.cyclesCompleted) ? '✅' : '🍅';
            if(i < this.state.timeAllocations.breakSessions.length) html += ' ☕️ ';
        }
        return `Cycle ${this.state.cyclesCompleted + 1} / ${totalCycles} <br> ${html}`;
    },
    async completeAnalysisAndProceed() {
        UI.showLoader(true);
        const { brainDump, aiPrediction } = this.state.userInputs;
        const [feedback, summary] = await Promise.all([
            this.simulateApi("사용자의 기록을 분석한 결과, 핵심 개념은 파악했으나 각 요소 간의 유기적 '연결성'에 대한 설명이 부족합니다."),
            this.simulateApi("**넛지(Nudge):** 인간은 체계적으로 편향되어 있으며, '선택 설계'를 통해 더 나은 결정을 내리도록 부드럽게 개입할 수 있다.")
        ]);
        document.getElementById('reveal-my-thoughts').textContent = brainDump || " ";
        document.getElementById('reveal-ai-feedback').textContent = feedback;
        document.getElementById('reveal-my-prediction').textContent = aiPrediction || " ";
        document.getElementById('reveal-expert-summary').textContent = summary;
        UI.showLoader(false);
        this.handleStepLogic('step-6');
    },
    complete() { 
        clearInterval(this.state.timerInterval);
        const finalWriting = document.getElementById('final-writing-input').value;
        if (!finalWriting.trim()) { 
            UI.showToast('체화 글쓰기를 작성해야 합니다.', 'error'); return; 
        } 
        this.state.userInputs.finalWriting = finalWriting;
        document.dispatchEvent(new CustomEvent('sessionComplete', { detail: { finished: true, data: this.state.userInputs } })); 
    },
    simulateApi: (data, delay = 800) => new Promise(res => setTimeout(() => res(data), delay)),
};

// --- Ebbinghaus Module ---
const Ebbinghaus = {
    plants: [],
    getReviewInterval(strength) {
        if (strength <= 1) return 1;
        if (strength === 2) return 3;
        if (strength === 3) return 7;
        return Math.round(this.getReviewInterval(strength - 1) * 1.8);
    },
    load() {
        this.plants = JSON.parse(localStorage.getItem('metisPlants')) || [];
        this.plants.forEach(p => this.updatePlantState(p));
    },
    save() {
        localStorage.setItem('metisPlants', JSON.stringify(this.plants));
    },
    updatePlantState(plant) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const lastReviewed = new Date(plant.reviews[plant.reviews.length - 1].date);
        const interval = this.getReviewInterval(plant.strength);
        const nextReviewDate = new Date(lastReviewed);
        nextReviewDate.setDate(lastReviewed.getDate() + interval);
        plant.nextReviewDate = nextReviewDate.toISOString();
        const diffDays = Math.ceil((nextReviewDate - now) / (1000 * 60 * 60 * 24));
        plant.daysUntilReview = diffDays;
        
        if (diffDays <= 0) plant.status = 'urgent';
        else if (diffDays <= 3) plant.status = 'needs-care';
        else plant.status = 'healthy';

        if (plant.strength <= 2) plant.memoryStage = '단기 기억';
        else if (plant.strength <= 4) plant.memoryStage = '장기 기억 전환 중';
        else plant.memoryStage = '장기 기억';
    },
    plantSeed(sessionData) {
        const goal = document.querySelector('#main-book-goal p').textContent;
        const sourceBook = document.getElementById('main-book-title').textContent;
        const { gap, finalWriting } = sessionData;
        const newPlant = {
            id: Date.now(),
            title: goal,
            sourceBook: sourceBook,
            question: `[핵심 질문] ${gap}\n\n당신이 체화한 지식:`,
            answer: finalWriting,
            strength: 1,
            reviews: [{ date: new Date().toISOString() }]
        };
        this.plants.push(newPlant);
        this.save();
        this.initGarden();
    },
    initGarden() {
        this.load();
        UI.renderGarden(this.plants);
    },
    getPlantById(id) {
        return this.plants.find(p => p.id == id);
    },
    startReview(plantId) {
        const plant = this.getPlantById(plantId);
        if(!plant) return;
        let challengeType = 'recall';
        if(plant.strength >= 5) challengeType = 'critique';
        else if (plant.strength >= 3) challengeType = 'connect';
        const challenge = { type: challengeType, question: plant.question, sourceBook: plant.sourceBook };
        
        UI.Challenge.show(challenge, (confidence) => {
            plant.reviews.push({ date: new Date().toISOString(), confidence });
            if (confidence === 'confident') plant.strength += 1;
            else if (confidence === 'guess') plant.strength = Math.max(1, plant.strength - 1);
            this.save();
            this.initGarden();
            UI.showToast('복습 완료! 지식의 힘이 강해졌습니다.', 'success');
        });
    },
    generateCurveData(startDate, strength, days = 30) {
        const data = [];
        const decayRate = 0.3 / Math.log(strength + 1.5);
        for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const retention = 100 * Math.exp(-i * decayRate);
            data.push({ x: date.getTime(), y: retention });
        }
        return data;
    },
    createChartConfig(plant) {
        const datasets = [{
            label: '현재 망각 곡선',
            data: this.generateCurveData(plant.reviews[plant.reviews.length - 1].date, plant.strength),
            borderColor: 'rgba(234, 67, 53, 0.8)',
            tension: 0.4,
            pointRadius: 0
        }];
        plant.reviews.forEach((review, index) => {
            datasets.push({
                label: `${index + 1}차 복습`,
                data: [{ x: new Date(review.date).getTime(), y: 100 }],
                borderColor: 'rgba(52, 168, 83, 1)',
                backgroundColor: 'rgba(52, 168, 83, 1)',
                pointStyle: 'rectRot',
                radius: 7
            });
        });
        return {
            type: 'line',
            data: { datasets },
            options: {
                scales: {
                    x: { type: 'time', time: { unit: 'day' } },
                    y: { min: 0, max: 105, title: { display: true, text: '기억 보유량 (%)' } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        };
    }
};

// --- App Initialization and Global Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('.app-container');
    let currentPlant = null;
    
    app.addEventListener('click', (e) => {
        const target = e.target;
        
        // Sidebar Navigation
        const navBtn = target.closest('.nav-btn');
        if (navBtn) { 
            UI.switchView(navBtn.dataset.view);
            if (navBtn.dataset.view === 'garden') {
                Ebbinghaus.initGarden();
            }
            return;
        }
        
        // Dashboard Controls
        if (target.closest('.course-btn')) {
            document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
            target.closest('.course-btn').classList.add('active');
            return;
        }
        if (target.closest('#change-book-btn')) { BookExplorer.init(); return; }
        if (target.closest('#start-goal-navigator-btn')) {
            const currentBookTitle = document.getElementById('main-book-title').textContent;
            GoalNavigator.init(currentBookTitle);
            return;
        }
        if (target.closest('#start-session-btn')) {
            UI.switchView('metis-session-view');
            MetisSession.init();
            return;
        }
        
        // Metis Session Controls
        if (target.closest('#back-to-dashboard-btn')) {
            UI.showConfirm("세션을 중단하고 돌아가시겠습니까?", () => {
                MetisSession.reset();
                UI.switchView('dashboard');
            });
            return;
        }
        if (target.closest('.next-step-btn')) { MetisSession.proceed(); return; }
        if (target.id === 'finish-reading-btn') { MetisSession.handleFocusEnd(); return; }
        if (target.id === 'start-next-cycle-btn') { MetisSession.handleBreakEnd(); return; }
        if (target.id === 'finish-session-btn') { MetisSession.complete(); return; }

        // Garden Controls
        const plantCard = target.closest('.plant-card');
        if (plantCard) {
            const plantId = plantCard.dataset.id;
            currentPlant = Ebbinghaus.getPlantById(plantId);
            if (!currentPlant) return;
            if (currentPlant.status === 'healthy') {
                UI.Dashboard.show(currentPlant, Ebbinghaus.createChartConfig(currentPlant));
            } else {
                Ebbinghaus.startReview(plantId);
            }
            return;
        }
        
        // Dashboard Modal Controls
        if (target.closest('#dashboard-modal-overlay') && !target.closest('#dashboard-modal-content')) { UI.Dashboard.hide(); return; }
        const simulateBtn = target.closest('#simulate-review-btn');
        if (simulateBtn) {
            if(!currentPlant) return;
            const simulatedStrength = currentPlant.strength + 1;
            const simulatedData = {
                label: '시뮬레이션: 오늘 복습 시',
                data: Ebbinghaus.generateCurveData(new Date(), simulatedStrength),
                borderColor: 'rgba(66, 133, 244, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0
            };
            UI.Dashboard.updateChart(simulatedData);
            simulateBtn.disabled = true;
            simulateBtn.textContent = '✅ 시뮬레이션 완료';
            return;
        }

    });

    const tooltipIcon = document.getElementById('course-tooltip-icon');
    const tooltip = document.getElementById('course-tooltip');
    tooltipIcon.addEventListener('mouseenter', () => {
        const rect = tooltipIcon.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.display = 'block';
    });
    tooltipIcon.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    document.addEventListener('bookSelected', (e) => {
        const book = e.detail;
        document.getElementById('main-book-cover').src = book.cover;
        document.getElementById('main-book-title').textContent = book.title;
        document.getElementById('main-book-author').textContent = book.author;
        UI.showToast(`${book.title}(으)로 메인북이 변경되었습니다!`, 'success');
    });
    
    document.addEventListener('goalSelected', (e) => {
        const { level, text } = e.detail;
        document.querySelector('#main-book-goal').innerHTML = `<strong>🎯 현재 목표 (레벨 ${level})</strong><p>${text}</p>`;
        UI.showToast('새로운 학습 목표가 설정되었습니다.', 'success');
    });

    document.addEventListener('sessionComplete', (e) => {
        MetisSession.reset();
        UI.switchView('dashboard');
        if (e.detail.finished) {
            Ebbinghaus.plantSeed(e.detail.data);
            UI.showToast("세션 완료! 지식 정원에 새 씨앗이 심어졌습니다.", "success");
        }
    });
    
    UI.switchView('dashboard');
});

