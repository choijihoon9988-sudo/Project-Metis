// js/ui.js
export const UI = {
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

    updateTimer(timeLeft, elementId) {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        const timerEl = document.getElementById(elementId);
        if (timerEl) {
            timerEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    },

    updateProgress(progressHTML) {
        const progressEl = document.getElementById('session-progress');
        if(progressEl) progressEl.innerHTML = progressHTML;
    },

    showLoader(show, text = "AI가 분석 중입니다...") {
         const loader = document.getElementById('loader');
         loader.querySelector('.loader-text').textContent = text;
         loader.style.display = show ? 'flex' : 'none';
    },

    showToast(message, type = 'success') {
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        
        // Fading in
        setTimeout(() => {
            t.style.bottom = '20px';
            t.style.opacity = '1';
        }, 10);
        
        // Fading out
        setTimeout(() => {
            t.style.opacity = '0';
             setTimeout(() => { t.remove(); }, 500);
        }, 3000);
    },

    showConfirm(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.innerHTML = `
            <div class="modal-body"><p>${message}</p></div>
            <div class="modal-controls">
                <button id="confirm-cancel" class="btn">취소</button>
                <button id="confirm-ok" class="btn btn-primary">확인</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('#confirm-cancel').addEventListener('click', close);
        overlay.querySelector('#confirm-ok').addEventListener('click', () => {
            onConfirm();
            close();
        });
    },

    renderComparison(data) {
        document.getElementById('reveal-my-thoughts').textContent = data.myThoughts || " ";
        document.getElementById('reveal-ai-feedback').textContent = data.aiFeedback || " ";
        document.getElementById('reveal-my-prediction').textContent = data.myPrediction || " ";
        document.getElementById('reveal-expert-summary').textContent = data.expertSummary || " ";
    },

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
                        <div class="book-result-card" data-title="${book.title}" data-author="${book.author || ''}">
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
        overlay: document.getElementById('goal-navigator-modal-overlay'),
        content: document.getElementById('goal-navigator-modal'),
        show() { this.overlay.style.display = 'flex'; },
        hide() { this.overlay.style.display = 'none'; },
        render(step, data) {
            let html = '';
            switch (step) {
                case 'chapterInput':
                    html = `<div class="modal-header"><h3>탐험 지도: ${data.bookTitle}</h3><p>오늘 학습할 챕터(또는 소주제)의 제목을 알려주세요.</p></div>
                            <div class="modal-body">
                                <input type="text" id="chapter-input" placeholder="예: 기준점 설정의 함정">
                            </div>
                            <div class="modal-controls">
                              <button id="generate-quests-btn" class="btn btn-primary">AI 퀘스트 생성</button>
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
                </div>
                <div class="modal-controls">
                    <button id="dashboard-start-review-btn" class="btn btn-primary">이 지식 복습하기</button>
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
                    this.hide();
                    if (target.id === 'challenge-submit-btn' && selectedConfidence) {
                        onComplete(selectedConfidence, document.getElementById('challenge-answer').value);
                    }
                    this.content.removeEventListener('click', clickHandler);
                }
            };
            this.content.addEventListener('click', clickHandler);
        },
        hide() { 
            if(this.overlay) this.overlay.style.display = 'none';
        }
    },
}; // <-- 이 부분이 수정되었습니다.