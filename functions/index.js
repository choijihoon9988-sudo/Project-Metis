// functions/index.js (수정된 코드)

const functions = require("firebase-functions");
const axios = require("axios");

// js/api.js 에 있던 당신의 키를 여기에 붙여넣으세요.
const GOOGLE_BOOKS_API_KEY = "AIzaSyCULah5vm81WCnhcZuhumLO2cJ-82OJXJA"; 

exports.getBookDetails = functions.https.onCall(async (data, context) => {
  const bookTitle = data.bookTitle;
  if (!bookTitle) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "책 제목(bookTitle)이 필요합니다."
    );
  }

  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    bookTitle
  )}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1`;

  try {
    const response = await axios.get(apiUrl);
    
    // 문제가 발생했던 라인을 아래와 같이 수정했습니다.
    const book = response.data.items && response.data.items.length > 0 
                 ? response.data.items[0].volumeInfo 
                 : null;

    if (book) {
      return { description: book.description || "이 책에 대한 설명이 없습니다." };
    } else {
      return { description: "책 정보를 찾을 수 없습니다." };
    }
  } catch (error) {
    console.error("Google Books API 호출 중 오류 발생:", error);
    throw new functions.https.HttpsError(
      "unknown",
      "책 정보를 가져오는 데 실패했습니다."
    );
  }
});