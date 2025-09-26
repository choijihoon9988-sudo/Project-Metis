// --- View Toggling ---
export const switchView = (viewName, navButtons) => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
};

export const showLoader = (show) => {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
};

// --- Metis Session UI ---
export const switchStep = (stepNumber) => {
    document.querySelectorAll('#metis-session .step').forEach(step => step.classList.remove('active'));
    const el = document.getElementById(`step-${stepNumber}`);
    if (el) {
        el.classList.add('active');
        document.getElementById('step-title').textContent = el.querySelector('h4').textContent;
    }
};
export const updateTimerDisplay = (timeLeft) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
export const populateComparisonView = (userInputs, aiData) => {
    document.getElementById('reveal-my-thoughts').textContent = userInputs.brainDump || "내용 없음";
    document.getElementById('reveal-my-prediction').textContent = userInputs.aiPrediction || "내용 없음";
    document.getElementById('reveal-ai-feedback').textContent = aiData.feedback;
    document.getElementById('reveal-expert-summary').textContent = aiData.expertSummary;
};

// --- Knowledge Storage & Mission Board UI ---
export const renderMissionBoard = (unlockedCapsules, onReview) => {
    const container = document.getElementById('mission-list');
    if (!container) return;
    if (unlockedCapsules.length === 0) {
        container.innerHTML = '<p>오늘 개봉된 캡슐이 없습니다. 모든 지식이 안전하게 보관 중입니다!</p>';
        return;
    }
    container.innerHTML = unlockedCapsules.map(capsule => `
        <div class="mission-item">
            <span class="mission-item-title">${capsule.title}</span>
            <button class="btn btn-primary btn-review" data-id="${capsule.id}">지금 복습</button>
        </div>
    `).join('');
    container.querySelectorAll('.btn-review').forEach(btn => {
        btn.onclick = () => {
            const capsule = unlockedCapsules.find(c => c.id == btn.dataset.id);
            onReview(capsule);
        };
    });
};
export const renderCapsuleStorage = (capsules, onReview) => {
    const container = document.getElementById('storage-container');
    if (!container) return;
    container.innerHTML = '';
    if (capsules.length === 0) {
        container.innerHTML = '<p>아직 보관된 지식 캡슐이 없습니다. 메티스 세션을 통해 첫 지식을 탐험해보세요!</p>';
        return;
    }
    capsules.forEach(capsule => {
        const capsuleEl = document.createElement('div');
        capsuleEl.className = `capsule ${capsule.state}`;
        capsuleEl.dataset.id = capsule.id;
        let statusHTML = '';
        if (capsule.state === 'locked') {
            statusHTML = `<div class="capsule-status">🔒 ${capsule.daysUntilUnlock}일 후 개봉</div>`;
        } else {
            statusHTML = `<div class="capsule-status">🔑 지금 개봉 가능</div>`;
        }
        capsuleEl.innerHTML = `
            <div class="capsule-title">${capsule.title}</div>
            <div class="capsule-source">출처: ${capsule.sourceBook}</div>
            ${statusHTML}
        `;
        if (capsule.state === 'unlocked') {
            capsuleEl.onclick = () => onReview(capsule);
        }
        container.appendChild(capsuleEl);
    });
};

// --- Reading Notes UI ---
export const renderReadingNotes = (books, notes, handlers) => {
    const bookSelect = document.getElementById('note-book-select');
    const container = document.getElementById('reading-notes-container');
    if (!bookSelect || !container) return;

    // Populate book selector, preserving current selection
    const currentBook = bookSelect.value;
    bookSelect.innerHTML = books.map(book => `<option value="${book}" ${book === currentBook ? 'selected' : ''}>${book}</option>`).join('');

    // Filter and display notes for the selected book
    const selectedBook = bookSelect.value;
    const filteredNotes = notes.filter(note => note.book === selectedBook);

    if (filteredNotes.length === 0) {
        container.innerHTML = '<p>아직 이 책에 대한 노트가 없습니다. 첫 생각을 기록해보세요.</p>';
    } else {
        container.innerHTML = filteredNotes.map(note => `
            <div class="reading-note ${note.highlighted ? 'highlighted' : ''}" data-id="${note.id}">
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                    ${note.highlighted ? `<button class="btn btn-primary btn-start-session" data-id="${note.id}">메티스 세션 시작</button>` : ''}
                    <button class="btn btn-highlight" data-id="${note.id}">${note.highlighted ? '하이라이트 취소' : '하이라이트'}</button>
                    <button class="btn btn-delete" data-id="${note.id}">삭제</button>
                </div>
            </div>
        `).join('');
    }

    // Re-attach event listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => handlers.delete(btn.dataset.id);
    });
    document.querySelectorAll('.btn-highlight').forEach(btn => {
        btn.onclick = () => handlers.highlight(btn.dataset.id);
    });
    document.querySelectorAll('.btn-start-session').forEach(btn => {
        btn.onclick = () => handlers.startSession(btn.dataset.id);
    });
};


// --- Modals UI ---
const challengeModalOverlay = document.getElementById('challenge-modal-overlay');
const challengeModalContent = document.getElementById('challenge-modal');
export const showChallengeModal = (capsule, onComplete) => {
    challengeModalContent.innerHTML = `<h3 class="challenge-title">캡슐 개봉</h3><p class="challenge-description">"${capsule.sourceBook}"에서 배운 내용을 떠올려보세요.</p><div class="challenge-prompt">${capsule.question}</div><textarea id="challenge-answer" placeholder="당신의 언어로 자유롭게 설명해보세요..."></textarea><div class="confidence-rating"><p>이번 답변에 얼마나 확신했나요?</p><div class="confidence-buttons"><button class="btn" data-confidence="confident">확신함</button><button class="btn" data-confidence="unsure">긴가민가함</button><button class="btn" data-confidence="guess">추측함</button></div></div><div class="challenge-controls"><button id="challenge-cancel-btn" class="btn">취소</button><button id="challenge-submit-btn" class="btn btn-primary" disabled>복습 완료</button></div>`;
    const submitBtn = document.getElementById('challenge-submit-btn');
    let selectedConfidence = null;
    document.querySelectorAll('.confidence-buttons .btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.confidence-buttons .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedConfidence = btn.dataset.confidence;
            submitBtn.disabled = false;
        }
    });
    document.getElementById('challenge-cancel-btn').onclick = hideChallengeModal;
    document.getElementById('challenge-submit-btn').onclick = () => onComplete(selectedConfidence);
    challengeModalOverlay.style.display = 'flex';
};
export const hideChallengeModal = () => { challengeModalOverlay.style.display = 'none'; };

const goalModalOverlay = document.getElementById('goal-navigator-modal-overlay');
const goalModalContent = document.getElementById('goal-navigator-content');
export const showGoalNavigator = () => { goalModalOverlay.style.display = 'flex'; };
export const hideGoalNavigator = () => { goalModalOverlay.style.display = 'none'; };
export const renderGoalNavigatorStep = (step, data) => { let content = ''; switch (step) { case 'modeSelection': content = `<div class="modal-header"><h3>AI 목표 내비게이터</h3><p><strong>${data.bookTitle}</strong>에 대한 학습 목표 설정을 시작합니다.<br>어떤 방식으로 목표를 설정하시겠습니까?</p></div><div class="mode-selection-container"><div class="mode-select-btn" data-mode="explorer"><div class="icon">🧭</div><h4>탐험가 모드</h4><p>AI가 생성한 목표 팩에서<br>체계적으로 선택합니다.</p></div><div class="mode-select-btn" data-mode="solver"><div class="icon">🛠️</div><h4>해결사 모드</h4><p>해결하고 싶은 문제를 입력하고<br>맞춤형 목표를 생성합니다.</p></div></div>`; break; case 'explorer': content = `<div class="modal-header"><h3>🧭 탐험가 모드</h3><p>AI가 생성한 목표 팩입니다. 가장 마음에 드는 목표를 선택하세요.</p></div><div class="goal-pack-container">${data.goalPack.map(goal => `<div class="goal-card" data-level="${goal.level}" data-text="${goal.text}"><strong>[레벨 ${goal.level}]</strong> ${goal.text}</div>`).join('')}</div>`; break; case 'solver': content = `<div class="modal-header"><h3>🛠️ 해결사 모드</h3><p>이 책을 통해 해결하고 싶은 당신의 문제를 구체적으로 알려주세요.</p></div><div class="solver-chat"><textarea id="solver-problem-input" placeholder="예: 곧 중요한 면접이 있는데, 면접관의 의도를 파악하고 좋은 인상을 남기고 싶어요."></textarea></div><div class="modal-controls"><button id="solver-submit-problem" class="btn btn-primary">문제 제출하고 목표 생성</button></div>`; break; case 'architect': content = `<div class="modal-header"><h3>✅ 목표 확정 및 개인화</h3><p>AI가 제안한 목표입니다. 자유롭게 수정하여 당신만의 최종 미션으로 확정하세요.</p></div><div class="architect-editor"><textarea id="architect-goal-editor">${data.text}</textarea></div><div class="modal-controls"><button id="architect-confirm-goal" class="btn btn-primary">나의 메인 목표로 설정</button></div>`; break; } goalModalContent.innerHTML = content; };