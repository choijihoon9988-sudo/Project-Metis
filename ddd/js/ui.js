// js/ui.js
// --- UI Module ---
// 이 모듈은 화면에 표시되는 모든 것을 그리고 조작하는 역할을 전담합니다.

export const UI = {
    /**
     * 지정된 이름의 뷰(view)를 활성화하고, 해당 뷰에 맞는 네비게이션 버튼을 활성 상태로 만듭니다.
     * @param {string} viewName - 활성화할 뷰의 ID
     */
    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const viewToShow = document.getElementById(viewName);
        if (viewToShow) {
            viewToShow.classList.add('active');
        }
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
    },

    /**
     * 메티스 세션의 특정 단계(step) 화면을 보여줍니다.
     * @param {string} stepId - 보여줄 단계의 ID (e.g., 'step-1')
     */
    switchStep(stepId) {
        document.querySelectorAll('#metis-session-view .step').forEach(s => s.classList.remove('active'));
        const stepToShow = document.getElementById(stepId);
        if (stepToShow) {
            stepToShow.classList.add('active');
            const titleEl = stepToShow.querySelector('h4');
            if(titleEl) {
                document.getElementById('step-title').textContent = titleEl.textContent;
            }
        }
    },

    /**
     * 타이머 UI를 업데이트합니다.
     * @param {number} timeLeft - 남은 시간 (초)
     * @param {string} elementId - 타이머를 표시할 HTML 요소의 ID
     */
    updateTimer(timeLeft, elementId) {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        const timerEl = document.getElementById(elementId);
        if (timerEl) {
            timerEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    },
    
    /**
     * 로딩 오버레이를 표시하거나 숨깁니다.
     * @param {boolean} show - 표시 여부
     * @param {string} text - 로딩 화면에 표시할 텍스트
     */
    showLoader(show, text = "AI가 분석 중입니다...") {
         const loader = document.getElementById('loader');
         loader.querySelector('.loader-text').textContent = text;
         loader.style.display = show ? 'flex' : 'none';
    },

    /**
     * 화면에 짧은 메시지(토스트)를 표시했다가 사라지게 합니다.
     * @param {string} message - 표시할 메시지
     * @param {string} [type='success'] - 메시지 유형 ('success' 또는 'error')
     */
    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    },

    /**
     * 5단계 '비교 분석' 화면의 내용을 채웁니다.
     * @param {object} data - 화면에 표시할 데이터
     */
    renderComparison(data) {
        document.getElementById('reveal-my-thoughts').textContent = data.myThoughts || " ";
        document.getElementById('reveal-ai-feedback').textContent = data.aiFeedback || " ";
        document.getElementById('reveal-my-prediction').textContent = data.myPrediction || " ";
        document.getElementById('reveal-expert-summary').textContent = data.expertSummary || " ";
    },

    /**
     * 지식 정원 화면을 렌더링합니다.
     * @param {Array<object>} plants - 화면에 표시할 '지식 식물' 데이터 배열
     */
    renderGarden(plants) {
        const container = document.getElementById('garden-container');
        if (!container) return;

        container.innerHTML = '';

        if (plants.length === 0) {
            container.innerHTML = `<p class="empty-message">아직 정원에 식물이 없습니다. 메티스 세션을 통해 첫 씨앗을 심어보세요!</p>`;
            return;
        }

        plants.sort((a, b) => a.daysUntilReview - b.daysUntilReview).forEach(plant => {
            const el = document.createElement('div');
            el.className = `plant-card ${plant.status}`;
            el.dataset.id = plant.id;

            const reviewText = plant.daysUntilReview <= 0 
                ? (plant.daysUntilReview === 0 ? '오늘 복습!' : `${-plant.daysUntilReview}일 지남!`)
                : `복습까지 ${plant.daysUntilReview}일`;

            el.innerHTML = `
                <div class="plant-title">${plant.title}</div>
                <div class="plant-source">${plant.sourceBook}</div>
                <div class="plant-status">${reviewText}</div>
            `;
            container.appendChild(el);
        });
    },

    // --- 모달 렌더링 객체들 ---

    BookExplorer: {
        // ... 기존 BookExplorer 코드 ...
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
                                <button id="book-explorer-confirm-btn" class="btn btn-primary">이 책으로 목표 설정하기</button>
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
        // ... 기존 GoalNavigator 코드 ...
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
                                        <div class="toc-chapters" style="display: none;">
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

    // --- 신규 추가 ---
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

    // --- 신규 추가 ---
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
                    <div class="challenge-prompt">${challenge.question.replace(/\n/g, '<br>')}</div>
                    <textarea id="challenge-answer" placeholder="당신의 언어로 자유롭게 설명해보세요..."></textarea>
                    <div class="confidence-rating">
                        <p>이번 답변에 얼마나 확신했나요?</p>
                        <div class="confidence-buttons">
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
                        onComplete(selectedConfidence, document.getElementById('challenge-answer').value);
                    }
                    this.hide(e.currentTarget); // Pass the element to remove the listener from
                }
            };
            this.content.addEventListener('click', clickHandler);
        },
        hide(listenerTarget) { 
            if(this.overlay) this.overlay.style.display = 'none';
        }
    },
};

