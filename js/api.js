// js/api.js
// 이 모듈은 외부 API(Google Books, Gemini)와의 통신 및 API 키 중앙 관리를 담당합니다.
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚨 중요: 이 API 키들은 웹사이트에 노출됩니다. 개인적인 테스트 용도로만 사용하세요.
const GOOGLE_BOOKS_API_KEY = "AIzaSyAf6ORBoBpWBMEMWM0xyh31YGR-5jWwTqA";
const GEMINI_API_KEY = "AIzaSyAf6ORBoBpWBMEMWM0xyh31YGR-5jWwTqA"; // 여기에 실제 키를 넣으셨을테니 그대로 두시면 됩니다.

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

// Gemini AI 인스턴스를 여기서 생성하여 다른 모듈에서 사용하도록 합니다.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
export const geminiTextModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "text/plain" } });


export const GoogleBooksAPI = {
    /**
     * Google Books API를 호출하여 책을 검색합니다.
     * @param {string} query - 검색어 (책 제목)
     * @returns {Promise<Array<object>>} - 검색된 책 정보 배열
     */
    async searchBooks(query) {
        if (!GOOGLE_BOOKS_API_KEY) {
            console.warn("Google Books API 키가 설정되지 않았습니다. /js/api.js 파일을 확인해주세요. 임시 데이터를 사용합니다.");
            return this.getDummyBooks(query);
        }

        try {
            const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=12&lang=ko`);
            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            
            return (data.items || []).map(item => ({
                id: item.id,
                title: item.volumeInfo.title,
                author: (item.volumeInfo.authors || ['저자 정보 없음']).join(', '),
                cover: item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192.png?text=No+Cover'
            }));
        } catch (error) {
            console.error("Google Books API 호출 중 오류 발생:", error);
            UI.showToast("책 검색 중 오류가 발생했습니다. API 키와 설정을 확인해주세요.", "error");
            return [];
        }
    },

    /**
     * API 키가 없을 때 사용할 가상 데이터입니다.
     */
    getDummyBooks(query) {
        const DUMMY_BOOKS_DATA = [
            { id: "1", title: "넛지 (Nudge)", author: "리처드 H. 탈러, 캐스 R. 선스타인", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1593003033l/54495910.jpg" },
            { id: "2", title: "사피엔스", author: "유발 하라리", cover: "https://image.aladin.co.kr/product/30883/29/cover500/k252830635_1.jpg" },
            { id: "3", title: "클린 코드", author: "로버트 C. 마틴", cover: "https://image.aladin.co.kr/product/1324/3/cover500/890120935x_1.jpg" },
            { id: "4", title: "역행자", author: "자청", cover: "https://image.aladin.co.kr/product/29306/17/cover500/s972837389_1.jpg"},
            { id: "5", title: "부의 추월차선", author: "엠제이 드마코", cover: "https://image.aladin.co.kr/product/10/3/cover500/8932917248_2.jpg"}
        ];
        
        const lowerCaseQuery = query.toLowerCase();
        if (!lowerCaseQuery) return [];
        
        return DUMMY_BOOKS_DATA.filter(book => 
            book.title.toLowerCase().includes(lowerCaseQuery) ||
            book.author.toLowerCase().includes(lowerCaseQuery)
        );
    }
};