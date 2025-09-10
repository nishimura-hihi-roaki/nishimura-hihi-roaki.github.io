// utils.js - ユーティリティ関数

class Utils {
    // 数値をフォーマット（1,234,567 形式）
    static formatNumber(num) {
        if (!num || isNaN(num)) return '0';
        return parseInt(num).toLocaleString();
    }

    // 日付部分のみを取得
    static getDateOnly(dateString) {
        const match = dateString.match(/^(\d{4}\/\d{2}\/\d{2})/);
        return match ? match[1] : dateString;
    }

    // 日付表示用フォーマット
    static formatDateForDisplay(dateString) {
        return dateString; // AM/PM付きのまま表示
    }

    // カテゴリ別色を取得
    static getCategoryColor(category) {
        const colors = {
            'All': 'rgba(79, 195, 247, 1)',
            '音楽': 'rgba(236, 21, 97, 1)',
            'エンターテイメント': 'rgba(255, 153, 57, 1)',
            'ゲーム': 'rgba(43, 171, 81, 1)',
            'ハウツーとスタイル': 'rgba(156, 39, 176, 1)',
            'ペットと動物': 'rgba(255, 193, 7, 1)'
        };
        return colors[category] || 'rgba(158, 158, 158, 1)';
    }

    // ユニークIDの生成
    static generateUniqueId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 配列から重複を除去（URL基準）
    static removeDuplicatesByUrl(data) {
        const seenUrls = new Set();
        return data.filter(row => !seenUrls.has(row[10]) && seenUrls.add(row[10]));
    }

    // デバウンス関数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 平均値を計算
    static calculateAverage(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const validNumbers = numbers.filter(n => !isNaN(n) && n !== null);
        if (validNumbers.length === 0) return 0;
        return validNumbers.reduce((sum, num) => sum + parseFloat(num), 0) / validNumbers.length;
    }

    // データの統計情報を取得
    static getDataStatistics(data, column) {
        const values = data.map(row => parseFloat(row[column]) || 0).filter(v => v > 0);
        if (values.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };

        return {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: this.calculateAverage(values),
            count: values.length
        };
    }
}