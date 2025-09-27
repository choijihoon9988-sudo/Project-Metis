// js/ebbinghaus.js
import { UI } from './ui.js';
// Firebase의 Firestore 기능을 사용하기 위해 필요한 함수들을 가져옵니다.
import { db } from './firebase.js';
import { collection, doc, getDocs, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const Ebbinghaus = {
    plants: [],
    userId: null, // 현재 사용자의 고유 ID를 저장할 변수

    // 사용자 ID를 받아와서 모듈 내에 저장합니다.
    setUser(userId) {
        this.userId = userId;
    },

    getReviewInterval(strength) {
        if (strength <= 1) return 1;
        if (strength === 2) return 3;
        if (strength === 3) return 7;
        return Math.round(this.getReviewInterval(strength - 1) * 1.8);
    },

    // Firestore에서 데이터를 비동기적으로 불러옵니다.
    async load() {
        if (!this.userId) return;
        const plantsCol = collection(db, 'users', this.userId, 'plants');
        const plantSnapshot = await getDocs(plantsCol);
        this.plants = plantSnapshot.docs.map(doc => doc.data());
        this.plants.forEach(p => this.updatePlantState(p));
    },

    // Firestore에 데이터를 비동기적으로 저장합니다.
    async savePlant(plantData) {
        if (!this.userId) return;
        // 각 plant의 id를 Firestore 문서의 id로 사용합니다.
        const plantRef = doc(db, 'users', this.userId, 'plants', String(plantData.id));
        await setDoc(plantRef, plantData);
    },
    
    // Firestore의 특정 식물 데이터를 업데이트합니다.
    async updatePlant(plantData) {
        if (!this.userId) return;
        const plantRef = doc(db, 'users', this.userId, 'plants', String(plantData.id));
        await updateDoc(plantRef, plantData);
    },

    updatePlantState(plant) {
        // ... (기존 updatePlantState 로직은 동일)
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

    async plantSeed(sessionData, bookInfo) {
        const sourceBook = bookInfo.title;
        const { gap, finalWriting } = sessionData;

        const newPlant = {
            id: Date.now(),
            title: gap, // 하이라이트/질문이 제목이 됨
            sourceBook,
            question: `[핵심 내용]\n${gap}`, // 질문은 핵심 내용
            answer: finalWriting, // 답변은 내 생각
            strength: 1,
            reviews: [{ date: new Date().toISOString() }]
        };

        this.updatePlantState(newPlant);
        await this.savePlant(newPlant);
    },

    async initGarden() {
        await this.load(); // Firestore에서 데이터를 불러올 때까지 기다립니다.
        UI.renderGarden(this.plants);
    },

    getPlantById(id) {
        // Firestore에서 불러온 데이터는 id가 숫자일 수 있으므로 문자열로 비교합니다.
        return this.plants.find(p => String(p.id) === String(id));
    },
    
    async startReview(plantId) {
        const plant = this.getPlantById(plantId);
        if(!plant) return;
        
        let challengeType = 'recall';
        if(plant.strength >= 5) challengeType = 'critique';
        else if (plant.strength >= 3) challengeType = 'connect';
        
        const challenge = { type: challengeType, question: plant.question, sourceBook: plant.sourceBook };
        
        UI.Challenge.show(challenge, async (confidence, answer) => {
            plant.reviews.push({ date: new Date().toISOString(), confidence, answer });

            if (confidence === 'confident') plant.strength += 1;
            else if (confidence === 'guess') plant.strength = Math.max(1, plant.strength - 1);
            
            this.updatePlantState(plant); // 상태 업데이트 후
            await this.updatePlant(plant); // Firestore에 업데이트된 정보 저장
            
            await this.initGarden(); // 정원 다시 그리기
            UI.showToast('복습 완료! 지식의 힘이 강해졌습니다.', 'success');
        });
    },

    // ... (generateCurveData와 createChartConfig 함수는 기존과 동일)
    generateCurveData(startDate, strength) {
        const data = [];
        const decayRate = 0.3 / Math.log(strength + 1.5);
        for (let i = 0; i <= 30; i++) {
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
    },

    async initJourneyMap() {
        await this.load();
        const container = document.getElementById('journey-map-container');
        const svg = document.getElementById('journey-map-svg');
        if (!container || !svg) return;

        container.querySelectorAll('.journey-node').forEach(node => node.remove());
        svg.innerHTML = '';

        if (this.plants.length === 0) {
            container.querySelector('.empty-message').style.display = 'block';
            return;
        }
        container.querySelector('.empty-message').style.display = 'none';

        const books = [...new Set(this.plants.map(p => p.sourceBook))];
        const nodes = [];
        const cWidth = container.clientWidth;
        const cHeight = container.clientHeight;
        const centerX = cWidth / 2;
        const centerY = cHeight / 2;

        books.forEach((bookTitle, i) => {
            const angle = (i / books.length) * 2 * Math.PI;
            const radius = Math.min(centerX, centerY) * 0.6;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            const nodeEl = document.createElement('div');
            nodeEl.className = 'journey-node book';
            nodeEl.textContent = bookTitle;
            nodeEl.style.left = `${x - 50}px`;
            nodeEl.style.top = `${y - 50}px`;
            container.appendChild(nodeEl);
            nodes.push({ id: bookTitle, x, y, el: nodeEl, type: 'book' });
        });

        this.plants.forEach(plant => {
            const parentBookNode = nodes.find(n => n.id === plant.sourceBook);
            if (!parentBookNode) return;

            const pAngle = Math.random() * 2 * Math.PI;
            const pRadius = 80 + Math.random() * 40;
            const x = parentBookNode.x + pRadius * Math.cos(pAngle);
            const y = parentBookNode.y + pRadius * Math.sin(pAngle);

            const nodeEl = document.createElement('div');
            nodeEl.className = 'journey-node plant';
            nodeEl.textContent = plant.title.substring(0, 15) + '...';
            nodeEl.title = plant.title;
            nodeEl.style.left = `${x - 35}px`;
            nodeEl.style.top = `${y - 35}px`;
            container.appendChild(nodeEl);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', parentBookNode.x);
            line.setAttribute('y1', parentBookNode.y);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'var(--border-color)');
            line.setAttribute('stroke-width', 2);
            svg.appendChild(line);
        });
    }
};