// js/main.js

import { ensureUserIsAuthenticated } from './firebase.js';
import { UI } from './ui.js';
import { Ebbinghaus } from './ebbinghaus.js';
import { MetisSession } from './metisSession.js';
import { BookExplorer } from './bookExplorer.js';
import { GoalNavigator } from './goalNavigator.js';
import { Refinement } from './refinement.js';
import { Library } from './library.js';

const appState = {
  user: null,
  currentPlant: null,
  currentRefinement: null,
  libraryCarouselIndex: 0,
};

function loadMainBook() {
    const savedBook = localStorage.getItem('mainBook');
    if (savedBook) {
        const book = JSON.parse(savedBook);
        document.getElementById('main-book-cover').src = book.cover;
        document.getElementById('main-book-title').textContent = book.title;
        document.getElementById('main-book-author').textContent = book.author;
        
        const goal = JSON.parse(localStorage.getItem('mainGoal'));
        if (goal) {
            document.querySelector('#main-book-goal').innerHTML = `<strong>현재 목표 (레벨 ${goal.level})</strong><p>${goal.text}</p>`;
        }
    }
}

async function main() {
  const user = await ensureUserIsAuthenticated();
  if (user) {
    appState.user = user;
    Ebbinghaus.setUser(user.uid);
    Refinement.setUser(user.uid);
    Library.setUser(user.uid);
    loadMainBook(); // 페이지 로드 시 저장된 메인북 정보 불러오기
    UI.switchView('dashboard');
    setupEventListeners();
    await Ebbinghaus.initGarden();
    await Refinement.load();
    await Library.load();
  } else {
    console.error("Firebase 인증 실패. 앱을 초기화할 수 없습니다.");
    UI.showToast("사용자 인증에 실패했습니다. 새로고침 해주세요.", "error");
  }
}

function setupEventListeners() {
  // 메인 콘텐츠 영역의 스크롤 이벤트를 감지
  const mainContent = document.querySelector('.main-content');
  mainContent.addEventListener('scroll', UI.Library.handleAltitudeScroll);

  document.body.addEventListener('click', async (event) => {
    const target = event.target;

    // --- 사이드바 네비게이션 ---
    const navBtn = target.closest('.nav-btn');
    if (navBtn) {
      const viewName = navBtn.dataset.view;
      UI.switchView(viewName);
      if (viewName === 'garden') await Ebbinghaus.initGarden();
      if (viewName === 'journey') await Ebbinghaus.initJourneyMap();
      if (viewName === 'library') {
          await Library.load();
          // 뷰 전환 시 고도 배경 즉시 업데이트
          UI.Library.handleAltitudeScroll();
      }
      return;
    }

    // --- 대시보드 버튼 ---
    if (target.closest('#start-session-btn')) {
      UI.switchView('metis-session-view');
      MetisSession.init();
      return;
    }
    if (target.closest('#change-book-btn') || target.closest('#add-new-book-to-library-btn')) {
      BookExplorer.init();
      return;
    }
    if (target.closest('#start-goal-navigator-btn')) {
      const title = document.getElementById('main-book-title').textContent;
      const book = {
          title: title,
          author: document.getElementById('main-book-author').textContent,
          cover: document.getElementById('main-book-cover').src
      }
      if (title) GoalNavigator.init(book);
      return;
    }
    const courseBtn = target.closest('.course-btn');
    if (courseBtn) {
      document.querySelectorAll('.course-btn').forEach(b => b.classList.remove('active'));
      courseBtn.classList.add('active');
      return;
    }

    // --- 나의 서재 ---
    const libraryBook = target.closest('.library-book');
    if (libraryBook) {
        const bookId = libraryBook.dataset.bookId;
        Library.showBookDetail(bookId);
        return;
    }
    const shelfArrow = target.closest('.shelf-arrow');
    if (shelfArrow) {
        const direction = shelfArrow.dataset.direction;
        const carousel = document.querySelector('.library-carousel');
        const slideCount = document.querySelectorAll('.library-shelf').length;
        
        if (direction === 'next') {
            appState.libraryCarouselIndex = (appState.libraryCarouselIndex + 1) % slideCount;
        } else {
            appState.libraryCarouselIndex = (appState.libraryCarouselIndex - 1 + slideCount) % slideCount;
        }
        carousel.style.transform = `translateX(-${appState.libraryCarouselIndex * 100}%)`;

        const shelfTitles = ['읽고 있는 책', '읽고 싶은 책', '다 읽은 책'];
        const shelfData = [Library.books.filter(b=>b.shelf==='reading'), Library.books.filter(b=>b.shelf==='toread'), Library.books.filter(b=>b.shelf==='finished')];
        document.querySelector('.shelf-title').textContent = `${shelfTitles[appState.libraryCarouselIndex]} (${shelfData[appState.libraryCarouselIndex].length})`;

        // 선반 변경 시 고도 배경 즉시 업데이트
        UI.Library.handleAltitudeScroll();
        return;
    }


    // --- 메티스 세션 버튼 ---
    if (target.closest('.next-step-btn')) {
      MetisSession.proceed();
      return;
    }
    if (target.closest('#finish-session-btn')) {
      MetisSession.complete();
      return;
    }
    if (target.closest('#back-to-dashboard-btn')) {
      UI.showConfirm("세션을 중단하고 대시보드로 돌아가시겠습니까?", () => {
        UI.switchView('dashboard');
      });
      return;
    }

    // --- 메티스 세션 클리핑 버튼 ---
    if (target.id === 'add-clipping-btn') {
        document.getElementById('clipping-modal-overlay').style.display = 'flex';
        document.getElementById('clipping-input').focus();
        return;
    }
    if (target.id === 'cancel-clipping-btn' || !target.closest('.modal-content') && target.closest('#clipping-modal-overlay')) {
        document.getElementById('clipping-modal-overlay').style.display = 'none';
        document.getElementById('clipping-input').value = '';
        return;
    }
    if (target.id === 'save-clipping-btn') {
        const text = document.getElementById('clipping-input').value;
        MetisSession.addClipping(text);
        document.getElementById('clipping-modal-overlay').style.display = 'none';
        document.getElementById('clipping-input').value = '';
        return;
    }

    // --- 지식 정제소 리뷰 버튼 ---
    const reviewBtn = target.closest('.review-refinement-btn');
    if (reviewBtn) {
        const refinementId = reviewBtn.dataset.id;
        appState.currentRefinement = Refinement.getById(refinementId);
        if (appState.currentRefinement) {
            UI.ClippingReview.render(appState.currentRefinement);
            UI.switchView('clipping-review-view');
        }
        return;
    }
     if (target.id === 'back-to-dashboard-from-review' || target.id === 'finish-review-btn') {
        UI.switchView('dashboard');
        // TODO: finalize 로직은 finish-review-btn 클릭 시에만 실행되도록 수정 필요
        return;
    }

    // --- 지식 정제소 리뷰 페이지 내부 동작 ---
    const clippingItem = target.closest('.clipping-item');
    if (clippingItem) {
        const { clipId, stage, action } = clippingItem.dataset;
        if (action === 'toggle-highlight' && stage === '1') {
            const clip = appState.currentRefinement.clippings.find(c => c.id == clipId);
            clip.highlighted = !clip.highlighted;
            await Refinement.update(appState.currentRefinement.id, appState.currentRefinement.clippings);
            clippingItem.classList.toggle('highlighted');
        }
    }


    // --- 지식 정원 & 대시보드 모달 ---
    const plantCard = target.closest('.plant-card');
    if (plantCard) {
      const plantId = plantCard.dataset.id;
      appState.currentPlant = Ebbinghaus.getPlantById(plantId);
      if (appState.currentPlant) {
        const chartConfig = Ebbinghaus.createChartConfig(appState.currentPlant);
        UI.Dashboard.show(appState.currentPlant, chartConfig);
      }
      return;
    }
    
    // --- 모달 관련 버튼 ---
    if (target.closest('.modal-close-btn') || !target.closest('.modal-content') && target.closest('.modal-overlay')) {
        UI.Dashboard.hide();
        UI.Challenge.hide();
        UI.BookExplorer.hide();
        UI.GoalNavigator.hide();
        UI.Library.hide();
        // 모든 모달 오버레이를 닫도록 일반화
        document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.style.display = 'none');
        return;
    }
    if (target.closest('#simulate-review-btn')) {
      if (!appState.currentPlant) return;
      const simulatedStrength = appState.currentPlant.strength + 1;
      const simulatedData = {
        label: '시뮬레이션: 오늘 복습 시',
        data: Ebbinghaus.generateCurveData(new Date(), simulatedStrength),
        borderColor: 'rgba(66, 133, 244, 0.5)', borderDash: [5, 5], tension: 0.4, pointRadius: 0
      };
      UI.Dashboard.updateChart(simulatedData);
      return;
    }
    if (target.closest('#dashboard-start-review-btn')) {
      if (appState.currentPlant) {
        UI.Dashboard.hide();
        Ebbinghaus.startReview(appState.currentPlant.id);
      }
    }
  });

  // --- 커스텀 이벤트 리스너 ---
  document.addEventListener('bookSelected', (e) => {
    const book = e.detail;
    localStorage.setItem('mainBook', JSON.stringify(book)); // 선택한 책 정보를 localStorage에 저장
    document.getElementById('main-book-cover').src = book.cover;
    document.getElementById('main-book-title').textContent = book.title;
    document.getElementById('main-book-author').textContent = book.author;
    // 책이 바뀌면 목표는 초기화
    localStorage.removeItem('mainGoal');
    document.querySelector('#main-book-goal').innerHTML = `<p>새로운 목표를 설정해주세요.</p>`;
    UI.showToast(`'${book.title}'(으)로 메인북 변경!`, 'success');
    GoalNavigator.init(book);
  });

  document.addEventListener('goalSelected', (e) => {
    const goal = e.detail;
    localStorage.setItem('mainGoal', JSON.stringify(goal)); // 선택한 목표 정보를 localStorage에 저장
    document.querySelector('#main-book-goal').innerHTML = `<strong>현재 목표 (레벨 ${goal.level})</strong><p>${goal.text}</p>`;
    UI.showToast('새로운 학습 목표가 설정되었습니다.', 'success');
  });

  document.addEventListener('sessionComplete', async (e) => {
    if (e.detail.finished) {
        UI.switchView('dashboard');
        await Refinement.load();
    }
  });

  document.addEventListener('addBookToLibrary', e => {
      const { book, shelf } = e.detail;
      Library.addBook(book, shelf);
  });
}

main();