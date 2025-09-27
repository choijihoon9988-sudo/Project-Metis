// --- UI Module ---
// 이 모듈은 화면에 표시되는 모든 것을 그리고 조작하는 역할을 전담합니다.
// 다른 모듈은 이 파일의 함수를 호출하기만 하면 되며, 복잡한 HTML 구조를 알 필요가 없습니다.

export const UI = {
    /**
     * 지정된 이름의 뷰(view)를 활성화하고, 해당 뷰에 맞는 네비게이션 버튼을 활성 상태로 만듭니다.
     * @param {string} viewName - 활성화할 뷰의 ID ('dashboard', 'garden', 'journey', 'metis-session-view')
     */
    switchView(viewName) {
        // 모든 .view 요소에서 'active' 클래스를 제거하여 숨깁니다.
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        // 지정된 ID를 가진 .view 요소를 찾아 'active' 클래스를 추가하여 보여줍니다.
        const viewToShow = document.getElementById(viewName);
        if (viewToShow) {
            viewToShow.classList.add('active');
        }
        // 모든 네비게이션 버튼의 활성 상태를 초기화합니다.
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
    },

    /**
     * 화면에 짧은 메시지(토스트)를 표시했다가 사라지게 합니다.
     * @param {string} message - 표시할 메시지
     * @param {string} [type='success'] - 메시지 유형 ('success' 또는 'error')
     */
    showToast(message, type = 'success') {
        document.querySelectorAll('.toast').forEach(t => t.remove()); // 이전 토스트 제거
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    },
    
    // (이하 다른 UI 관련 객체 및 함수들은 나중에 채워나갈 예정입니다)
    BookExplorer: { /* ... */ },
    GoalNavigator: { /* ... */ },
    Dashboard: { /* ... */ },
    Challenge: { /* ... */ },
};
