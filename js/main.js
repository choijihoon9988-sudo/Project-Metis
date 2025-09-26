import { switchView } from './ui.js';
import { initializeSession, handleSessionCompletion } from './metisSession.js';
import { initializeEbbinghaus } from './ebbinghaus.js';
import { initializeGoalNavigator } from './goalNavigator.js';
import { initializeReadingNotes } from './readingNotes.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const startSessionBtn = document.getElementById('start-session-btn');
    const startGoalNavigatorBtn = document.getElementById('start-goal-navigator-btn');
    let lastView = 'dashboard';

    // --- VIEW SWITCHING LOGIC ---
    const handleViewSwitch = (viewName) => {
        const currentActive = document.querySelector('.view.active');
        if (currentActive) {
            lastView = currentActive.id;
        }
        
        switchView(viewName, navButtons);
        
        // Initialize modules based on the new view
        if (viewName === 'dashboard' || viewName === 'storage') {
            initializeEbbinghaus();
        }
        if (viewName === 'knowledge-lab') {
            initializeReadingNotes();
        }
    };

    // --- EVENT HANDLERS ---
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => handleViewSwitch(btn.dataset.view));
    });

    startSessionBtn.addEventListener('click', () => {
        handleViewSwitch('metis-session');
        initializeSession();
    });
    
    startGoalNavigatorBtn.addEventListener('click', () => {
        initializeGoalNavigator();
    });

    // --- CUSTOM EVENT LISTENERS ---
    document.addEventListener('sessionComplete', () => {
        handleSessionCompletion();
        handleViewSwitch(lastView); // Return to the view before the session started
    });

    document.addEventListener('goalSelected', (e) => {
        const { level, text } = e.detail;
        const goalEl = document.querySelector('#main-book-goal');
        goalEl.innerHTML = `
            <strong>🎯 현재 목표 (레벨 ${level})</strong>
            <p>${text}</p>
        `;
    });

    document.addEventListener('startSessionFromNote', (e) => {
        handleViewSwitch('metis-session');
        initializeSession(e.detail.note);
    });
    
    // --- APP START ---
    handleViewSwitch('dashboard');
});