// js/ui.js
// 이 모듈은 애플리케이션의 모든 DOM 조작 및 UI 렌더링을 담당합니다.

export const UI = {
    /**
     * 지정된 이름의 뷰(view)를 활성화하고 다른 뷰는 비활성화합니다.
     * @param {string} viewName - 활성화할 뷰의 ID ('dashboard', 'garden' 등)
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
     * 메티스 세션 내의 특정 단계(step)를 활성화합니다.
     * @param {string} stepId - 활성화할 단계의 ID ('step-1', 'step-2' 등)
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
     * @param {string} elementId - 시간을 표시할 요소의 ID
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
     * @param {string} text - 로딩 텍스트
     */
    showLoader(show, text = "AI가 분석 중입니다...") {
         const loader = document.getElementById('loader');
         loader.querySelector('.loader-text').textContent = text;
         loader.style.display = show ? 'flex' : 'none';
    },

    /**
     * 화면 하단에 토스트 메시지를 표시합니다.
     * @param {string} message - 표시할 메시지
     * @param {string} type - 'success' 또는 'error'
     */
    showToast(message, type = 'success') {
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        
        setTimeout(() => {
            t.style.bottom = '20px';
            t.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            t.style.opacity = '0';
             setTimeout(() => { t.remove(); }, 500);
        }, 3000);
    },

    /**
     * 사용자 확인 모달을 표시합니다.
     * @param {string} message - 표시할 메시지
     * @param {function} onConfirm - '확인' 버튼 클릭 시 실행될 콜백 함수
     */
    showConfirm(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';

        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.innerHTML = `
            <button class="modal-close-btn">&times;</button>
            <div class="modal-body"><p>${message}</p></div>
            <div class="modal-controls">
                <button id="confirm-cancel" class="btn">취소</button>
                <button id="confirm-ok" class="btn btn-primary">확인</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('.modal-close-btn').addEventListener('click', close);
        overlay.querySelector('#confirm-cancel').addEventListener('click', close);
        overlay.querySelector('#confirm-ok').addEventListener('click', () => {
            onConfirm();
            close();
        });
    },

    /**
     * '비교 분석' 단계의 내용을 렌더링합니다.
     * @param {object} data - { myThoughts, aiFeedback, myPrediction, expertSummary }
     */
    renderComparison(data) {
        document.getElementById('reveal-my-thoughts').textContent = data.myThoughts || " ";
        document.getElementById('reveal-ai-feedback').textContent = data.aiFeedback || " ";
        document.getElementById('reveal-my-prediction').textContent = data.myPrediction || " ";
        document.getElementById('reveal-expert-summary').textContent = data.expertSummary || " ";
    },

    /**
     * '지식 정원'의 모든 식물 카드를 렌더링합니다.
     * @param {Array<object>} plants - 식물 데이터 배열
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

    // --- 모달 UI 컴포넌트 ---

    BookExplorer: {
        overlay: document.getElementById('book-explorer-modal-overlay'),
        content: document.getElementById('book-explorer-modal'),
        show() { this.overlay.style.display = 'flex'; },
        hide() { this.overlay.style.display = 'none'; },
        render(step, data) {
            let html = '';
            const closeBtn = '<button class="modal-close-btn">&times;</button>';
            switch (step) {
                case 'search':
                    html = `${closeBtn}<div class="modal-header"><h3>AI 도서 탐색기</h3><p>어떤 책을 탐험하시겠어요?</p></div>
                            <div class="modal-body">
                              <input type="text" id="book-search-input" placeholder="책 제목을 입력하세요...">
                              <div id="book-search-results"></div>
                            </div>`;
                    break;
                case 'results':
                    html = (data.results.length > 0 ? data.results.map(book => `
                        <div class="book-result-card" data-title="${book.title}" data-author="${book.author || ''}" data-cover="${book.cover}">
                            <img src="${book.cover}" alt="${book.title}">
                        </div>`).join('') : '<p style="text-align:center; color: var(--text-light-color);">검색 결과가 없습니다.</p>');
                    break;
                case 'confirmation':
                    html = `${closeBtn}<div id="book-explorer-confirmation" class="modal-body" style="text-align: center;">
                                <img src="${data.cover}" alt="${data.title}" style="max-width: 180px; margin: 16px auto; border-radius: var(--border-radius); box-shadow: var(--shadow-md);">
                                <h4>${data.title}</h4>
                                <p>${data.author}</p>
                            </div>
                            <div class="modal-controls">
                                <button id="book-explorer-back-btn" class="btn">다시 검색</button>
                                <button id="book-explorer-add-btn" class="btn">내 서재에 추가</button>
                                <button id="book-explorer-select-main-btn" class="btn btn-primary">이 책으로 목표 설정하기</button>
                            </div>`;
                    break;
                case 'shelf-selection':
                     html = `${closeBtn}<div class="modal-header"><h3>어느 선반에 추가할까요?</h3></div>
                            <div class="modal-controls" style="justify-content: center; gap: 16px;">
                                <button class="btn shelf-select-btn" data-shelf="reading">읽고 있는 책</button>
                                <button class="btn shelf-select-btn" data-shelf="toread">읽고 싶은 책</button>
                                <button class="btn shelf-select-btn" data-shelf="finished">다 읽은 책</button>
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
            const closeBtn = '<button class="modal-close-btn">&times;</button>';
            switch (step) {
                case 'chapterInput':
                    html = `${closeBtn}<div class="modal-header"><h3>탐험 지도: ${data.bookTitle}</h3><p>오늘 학습할 챕터(또는 소주제)의 제목을 알려주세요.</p></div>
                            <div class="modal-body">
                                <input type="text" id="chapter-input" placeholder="예: 기준점 설정의 함정">
                            </div>
                            <div class="modal-controls">
                              <button id="generate-quests-btn" class="btn btn-primary">AI 퀘스트 생성</button>
                            </div>`;
                    break;
                case 'quests':
                    html = `${closeBtn}<div class="modal-header"><h3>학습 퀘스트 제안</h3><p><strong>${data.chapter}</strong> 챕터에 대한 퀘스트입니다. 마음에 드는 퀘스트를 선택하세요.</p></div>
                            <div class="modal-body quest-selection-grid">
                                ${data.quests.length > 0 ? data.quests.map(q => `
                                    <div class="quest-card" data-level="${q.level}" data-text="${q.text}">
                                        <h5>${q.type} (Level ${q.level})</h5>
                                        <p>${q.text}</p>
                                    </div>
                                `).join('') : '<p style="text-align:center;">이 챕터에 대한 추천 퀘스트가 없습니다.</p>'}
                            </div>
                            <div class="modal-controls">
                              <button id="goal-quests-back-btn" class="btn">챕터 다시 선택</button>
                            </div>`;
                    break;
                case 'editor':
                     html = `${closeBtn}<div class="modal-header"><h3>퀘스트 확정</h3><p>AI 제안 퀘스트를 수정하여 확정하세요.</p></div>
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

    Library: {
        overlay: document.getElementById('library-book-detail-modal-overlay'),
        content: document.getElementById('library-book-detail-modal'),
        show() { this.overlay.style.display = 'flex'; },
        hide() { if(this.overlay) this.overlay.style.display = 'none'; },
        
        render(books, skills) {
            const container = document.getElementById('library-carousel-container');
            if (!container) return;

            const shelves = {
                reading: { title: '읽고 있는 책', books: books.filter(b => b.shelf === 'reading') },
                toread: { title: '읽고 싶은 책', books: books.filter(b => b.shelf === 'toread') },
                finished: { title: '다 읽은 책', books: books.filter(b => b.shelf === 'finished') },
            };

            const finishedBookCount = shelves.finished.books.length;
            
            const finishedShelfHtml = `
                <div class="library-shelf" data-shelf="finished">
                    <div class="parallax-container"></div>
                    ${this.renderMilestones(finishedBookCount)}
                    <div class="book-grid">
                        ${finishedBookCount > 0 ? shelves.finished.books.map(b => this.renderBook(b)).join('') : '<p class="empty-message" style="color: #333;">이 선반에 책이 없습니다.</p>'}
                    </div>
                </div>
            `;
            
            const otherShelvesHtml = ['reading', 'toread'].map(shelfKey => {
                const shelf = shelves[shelfKey];
                return `
                    <div class="library-shelf" data-shelf="${shelfKey}">
                        <div class="book-grid">
                            ${shelf.books.length > 0 ? shelf.books.map(b => this.renderBook(b)).join('') : '<p class="empty-message">이 선반에 책이 없습니다.</p>'}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="shelf-header">
                    <button class="shelf-arrow prev" data-direction="prev">&#10094;</button>
                    <h3 class="shelf-title">${shelves.reading.title} (${shelves.reading.books.length})</h3>
                    <button class="shelf-arrow next" data-direction="next">&#10095;</button>
                </div>
                <div class="library-carousel">
                    ${otherShelvesHtml}
                    ${finishedShelfHtml}
                </div>
            `;
            
            const finishedShelf = container.querySelector('.library-shelf[data-shelf="finished"]');
            if (finishedShelf) {
                const maxBooksForFullAltitude = 50;
                const bookCount = shelves.finished.books.length;
                
                let altitudeHeight = '100vh';
                if (bookCount > 0) {
                    const dynamicHeight = 100 + Math.min(bookCount, maxBooksForFullAltitude) / maxBooksForFullAltitude * 300;
                    altitudeHeight = `${dynamicHeight}vh`;
                }
                finishedShelf.style.minHeight = altitudeHeight;
            }
            
            const statsContainer = document.getElementById('library-stats');
            const finishedThisMonth = books.filter(b => {
                if (!b.finishedAt) return false;
                const finishedDate = new Date(b.finishedAt);
                const now = new Date();
                return finishedDate.getFullYear() === now.getFullYear() && finishedDate.getMonth() === now.getMonth();
            }).length;
            
            const altitude = finishedBookCount * 50;
            statsContainer.innerHTML = `
                <h4>나의 독서 통계</h4>
                <p>이번 달에 ${finishedThisMonth}권의 책을 완독하셨습니다!</p>
                <p>현재 지식 고도: <strong>${altitude.toLocaleString()}m</strong></p>
                <hr style="margin: 16px 0;">
                <h4>이주의 챌린지</h4>
                <p>이번 주, '자기계발' 분야 책 1권 읽기</p>
            `;
        },

        renderBook(book) {
            // [수정] <img> 태그 대신, background-image를 사용하는 div로 변경
            return `
                <div class="library-book" data-book-id="${book.id}">
                    <div class="library-book-cover" style="background-image: url('${book.cover}')"></div>
                    <p>${book.title}</p>
                </div>
            `;
        },

        renderMilestones(bookCount) {
            const MILESTONES = [
                { count: 5, text: '🕊️ 63빌딩 높이에 도달했습니다!', position: 15 },
                { count: 15, text: '✈️ 에베레스트 산보다 높이 있습니다!', position: 35 },
                { count: 30, text: '🎈 성층권에 진입했습니다!', position: 70 },
                { count: 50, text: '🚀 우주에 오신 것을 환영합니다!', position: 95 },
            ];
            
            return MILESTONES.map(m => {
                if (bookCount >= m.count) {
                    return `<div class="knowledge-milestone" data-position="${m.position}" style="bottom: ${m.position}%;">${m.text}</div>`;
                }
                return '';
            }).join('');
        },
        
        // === [START] 최종 수정된 스크롤 효과 함수 (단일 이미지 버전) ===
        handleAltitudeScrollEffects(event) {
            const mainContent = event.target;
            const shelf = document.querySelector('.library-shelf[data-shelf="finished"]');
            const parallaxBg = shelf ? shelf.querySelector('.parallax-container') : null;

            if (!parallaxBg) return;

            const scrollableHeight = shelf.scrollHeight - mainContent.clientHeight;
            
            // 스크롤이 불가능하면 (책이 거의 없으면) 무조건 땅(bottom)을 보여줌
            if (scrollableHeight <= 0) {
                parallaxBg.style.backgroundPosition = 'center 100%'; // 'bottom'
                return;
            }

            const scrollTop = mainContent.scrollTop;
            const scrollPercentage = scrollTop / scrollableHeight;

            // 스크롤을 맨 아래(땅)로 내리면 scrollTop은 최대값, scrollPercentage는 1
            // 스크롤을 맨 위(우주)로 올리면 scrollTop은 0, scrollPercentage는 0
            // 배경 이미지의 Y 위치는 스크롤과 반대로 움직여야 함 (땅: 100%, 우주: 0%)
            const backgroundYPosition = 100 - (scrollPercentage * 100);
            
            parallaxBg.style.backgroundPosition = `center ${backgroundYPosition}%`;

            // 마일스톤 가시성 처리
            const milestones = shelf.querySelectorAll('.knowledge-milestone');
            // 현재 고도는 스크롤 위치와 반대
            const currentAltitudePercent = (1 - scrollPercentage) * 100;
            milestones.forEach(milestone => {
                const triggerPercent = parseFloat(milestone.dataset.position);
                // 현재 고도가 마일스톤 위치보다 높아지면 보이도록 처리
                milestone.classList.toggle('visible', currentAltitudePercent >= triggerPercent);
            });
        },
        // === [END] 최종 수정된 스크롤 효과 함수 (단일 이미지 버전) ===

        renderBookDetail(book, skills, recommendation) {
            this.content.innerHTML = `
                <button class="modal-close-btn">&times;</button>
                <div class="modal-header" style="text-align: left; display:flex; gap: 24px; align-items: flex-start;">
                    <img src="${book.cover}" alt="${book.title}" style="width: 150px; height: 225px; object-fit: cover; border-radius: var(--border-radius); flex-shrink: 0;">
                    <div>
                        <h3>${book.title}</h3>
                        <p>${book.author}</p>
                        <span class="book-tag">${book.category}</span>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="card">
                        <h5>핵심 성장 스킬</h5>
                        <p>${book.skillFocus}</p>
                    </div>
                    <div class="card">
                        <h5>AI 연관 도서 추천</h5>
                        <p>${recommendation}</p>
                    </div>
                </div>
            `;
            this.show();
        }
    },

    Dashboard: {
        overlay: document.getElementById('dashboard-modal-overlay'),
        content: document.getElementById('dashboard-modal-content'),
        chart: null,
        show(plant, chartConfig) {
            this.content.innerHTML = `
                <button class="modal-close-btn">&times;</button>
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
                        <h4>미래 예측</h4>
                        <p>지금 복습하면 미래의 기억 곡선이 어떻게 변할까요?</p>
                        <button id="simulate-review-btn" class="btn" style="width: 100%; margin-top: 8px;">오늘 복습 시뮬레이션</button>
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
        hide() { if(this.overlay) this.overlay.style.display = 'none'; },
        updateChart(newData) {
            if (!this.chart) return;
            const existingSimIndex = this.chart.data.datasets.findIndex(d => d.label.includes('시뮬레이션'));
            if(existingSimIndex > -1) this.chart.data.datasets.splice(existingSimIndex, 1);
            this.chart.data.datasets.push(newData);
            this.chart.update();
            const simulateBtn = document.getElementById('simulate-review-btn');
            if(simulateBtn) {
                simulateBtn.disabled = true;
                simulateBtn.textContent = '시뮬레이션 완료';
            }
        },
        renderRefinements(refinements) {
            const container = document.getElementById('refinement-list');
            if (!container) return;
            container.innerHTML = '';

            if (refinements.length === 0) {
                container.innerHTML = `<p class="empty-message">정제 중인 지식이 없습니다.</p>`;
                return;
            }

            const now = new Date();
            refinements.forEach(r => {
                const unlocksAt = new Date(r.unlocksAt);
                const isLocked = now < unlocksAt;
                
                let statusText = '';
                let buttonText = '';
                
                switch(r.stage) {
                    case 1: 
                        statusText = `2단계: 핵심 선별까지`;
                        buttonText = '클리핑 리뷰하기';
                        break;
                    case 2:
                        statusText = `3단계: 생각 연결까지`;
                        buttonText = '하이라이트 리뷰';
                        break;
                    case 3:
                        statusText = `최종: 정원 심기까지`;
                        buttonText = '지식 정원에 심기';
                        break;
                }

                if (isLocked) {
                    const diffHours = Math.ceil((unlocksAt - now) / (1000 * 60 * 60));
                    statusText += ` ${diffHours}시간 남음`;
                }

                const card = document.createElement('div');
                card.className = 'refinement-card';
                card.innerHTML = `
                    <img src="${r.bookCover}" alt="${r.bookTitle}">
                    <div class="refinement-info">
                        <p>${r.bookTitle}</p>
                        <span class="status">${statusText}</span>
                    </div>
                    <button class="btn ${isLocked ? '' : 'btn-primary'} review-refinement-btn" data-id="${r.id}" ${isLocked ? 'disabled' : ''}>
                        ${isLocked ? '잠김' : buttonText}
                    </button>
                `;
                container.appendChild(card);
            });
        }
    },
    
    ClippingReview: {
        render(refinement) {
            const content = document.getElementById('clipping-review-content');
            const header = document.getElementById('clipping-review-header');
            const finishBtn = document.getElementById('finish-review-btn');
            let instruction = '';

            switch(refinement.stage) {
                case 1:
                    instruction = '<h4>1일차 리뷰: 핵심 선별</h4><p>어제 수집한 지식 조각 중, 정말 중요하다고 생각하는 문장에만 하이라이트를 칠해주세요. 클릭하면 하이라이트됩니다.</p>';
                    header.textContent = "2단계: 핵심 선별";
                    finishBtn.textContent = '저장 후 닫기';
                    break;
                case 2:
                    instruction = '<h4>7일차 리뷰: 생각 연결</h4><p>일주일 전 하이라이트한 내용입니다. 왜 이 부분이 중요하다고 생각했는지, 어떻게 적용할 수 있을지 옆의 아이콘을 눌러 당신의 생각을 기록하세요.</p>';
                     header.textContent = "3단계: 생각 연결";
                     finishBtn.textContent = '저장 후 닫기';
                    break;
                case 3:
                    instruction = '<h4>30일차 리뷰: 최종 체화</h4><p>한 달간 정제한 지식의 정수입니다. 이 중 영구적으로 간직할 지식을 선택하여 당신의 정원에 씨앗으로 심어주세요.</p>';
                     header.textContent = "4단계: 정원에 심기";
                     finishBtn.textContent = '선택한 지식 정원에 심기';
                    break;
            }
            
            content.innerHTML = instruction + refinement.clippings.map(clip => this.renderClippingItem(clip, refinement.stage)).join('');
        },

        renderClippingItem(clip, stage) {
            const isHighlighted = clip.highlighted;
            let controls = '';
            let itemHtml = `<p class="clipping-text">${clip.text}</p>`;

            switch(stage) {
                case 1:
                    // 전체 아이템을 클릭 가능하게 만듭니다.
                    break;
                case 2:
                    if(isHighlighted) {
                        controls = `<button class="btn" data-action="add-note" data-clip-id="${clip.id}">생각 추가하기</button>`;
                    } else {
                        return ''; // 하이라이트 안된건 2단계에서 표시 안함
                    }
                    break;
                case 3:
                     if(isHighlighted && clip.note) {
                        controls = `<input type="checkbox" class="plant-seed-checkbox" data-clip-id="${clip.id}" style="width: 20px; height: 20px; margin-left: auto;">`;
                    } else {
                        return ''; // 노트 없는건 3단계에서 표시 안함
                    }
                    break;
            }

            return `
                <div class="clipping-item ${isHighlighted ? 'highlighted' : ''}" data-action="toggle-highlight" data-clip-id="${clip.id}" data-stage="${stage}">
                    ${itemHtml}
                    ${clip.note ? `<div class="clipping-note"><p><strong>내 생각:</strong> ${clip.note}</p></div>` : ''}
                    <div class="clipping-controls">${controls}</div>
                </div>
            `;
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
                <button class="modal-close-btn">&times;</button>
                <div class="modal-body">
                    ${challengeHTML}
                    <div class="challenge-prompt" style="padding: 16px; background-color: var(--background-color); border-radius: var(--border-radius); margin: 16px 0;">${challenge.question.replace(/\n/g, '<br>')}</div>
                    <textarea id="challenge-answer" placeholder="당신의 언어로 자유롭게 설명해보세요..."></textarea>
                    <div class="confidence-rating">
                        <p>이번 답변에 얼마나 확신했나요?</p>
                        <div class="confidence-buttons" style="display: flex; gap: 8px;">
                            <button class="btn" data-confidence="confident" style="flex:1;">확신함</button>
                            <button class="btn" data-confidence="unsure" style="flex:1;">긴가민가함</button>
                            <button class="btn" data-confidence="guess" style="flex:1;">추측함</button>
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
                } else if (target.id === 'challenge-cancel-btn' || target.id === 'challenge-submit-btn' || target.classList.contains('modal-close-btn')){
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
};