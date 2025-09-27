// Spaced Repetition Interval (in days): 1, 3, 7, 16, 35...
export function getReviewIntervalDays(strength) {
    if (strength <= 1) return 1;
    if (strength === 2) return 3;
    if (strength === 3) return 7;
    return Math.round(getReviewIntervalDays(strength - 1) * 2.1);
}

// Generates data points for the Ebbinghaus forgetting curve for Chart.js
export const generateCurveData = (startDate, strength, days) => {
    const data = [];
    const decayFactor = 0.5 / Math.log(strength + 1.5);
    for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const retention = 100 * Math.exp(-i * decayFactor);
        data.push({ x: date, y: retention });
    }
    return data;
};