// js/api.js
// 이 모듈은 외부 API(Google Books API)와의 통신을 담당합니다.

const API_KEY = "AIzaSyAf6ORBoBpWBMEMWM0xyh31YGR-5jWwTqA"; 
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

export const GoogleBooksAPI = {
    /**
     * Google Books API를 호출하여 책을 검색합니다.
     * @param {string} query - 검색어 (책 제목)
     * @returns {Promise<Array<object>>} - 검색된 책 정보 배열
     */
    async searchBooks(query) {
        // API 키가 비어있는 경우에만 경고를 표시하고 임시 데이터를 사용합니다.
        if (!API_KEY) {
            console.warn("Google Books API 키가 설정되지 않았습니다. /js/api.js 파일을 확인해주세요. 임시 데이터를 사용합니다.");
            return this.getDummyBooks(query);
        }

        try {
            const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=12&lang=ko`);
            if (!response.ok) {
                // API 키 자체에 문제가 있거나(403), API 사용 설정이 안된 경우(403),
                // 혹은 다른 네트워크 문제(404 등)가 있을 때 이곳에서 에러를 잡습니다.
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
            // 사용자에게도 오류가 발생했음을 알려주는 것이 좋습니다.
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

