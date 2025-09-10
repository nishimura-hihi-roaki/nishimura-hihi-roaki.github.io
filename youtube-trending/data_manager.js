// dataManager.js - データ取得・管理クラス

class DataManager {
    constructor() {
        this.allYouTubeData = [];
        this.categoryData = [];
        this.availableDates = [];
        this.cache = new Map();
        
        // GAS URL（本番用）
        this.urls = {
            main: 'https://script.google.com/macros/s/AKfycbyuJJHMMKtAyijttT1-RAJBF2q3l3RfwcStdqgEdlggCGBL0pWKUGdm5nuREoWftwpr/exec',
            category: 'https://script.google.com/macros/s/AKfycbwYLE7XorPdhO1TJGZFzzaPmgorckF1pf4elNaG-gcUdr2EZd1SO5USH4rTbn5qguDA/exec'
        };
    }

    // メインのYouTubeデータを取得
    async fetchYouTubeData() {
        try {
            const cacheKey = 'main_youtube_data';
            
            // キャッシュチェック（5分間有効）
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                    this.processMainData(cached.data);
                    return cached.data;
                }
            }

            const response = await fetch(this.urls.main);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // キャッシュに保存
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            this.processMainData(data);
            return data;

        } catch (error) {
            console.error('メインデータの取得に失敗:', error);
            throw error;
        }
    }

    // メインデータの処理
    processMainData(data) {
        this.allYouTubeData = data.slice(1); // ヘッダー行を除外
        
        // 利用可能な日付を取得してソート（新しい順）
        this.availableDates = [...new Set(
            this.allYouTubeData.map(row => Utils.getDateOnly(row[0]))
        )].sort((a, b) => new Date(b) - new Date(a));
    }

    // カテゴリ別YouTubeデータ取得（JSONP版）
    async fetchYouTubeDataByCategory(category = "All") {
        try {
            const cacheKey = `category_${category}`;
            
            // キャッシュチェック（10分間有効）
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
                    return cached.data;
                }
            }

            console.log(`カテゴリ "${category}" のデータ取得中...`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await new Promise((resolve, reject) => {
                const callbackName = 'jsonpCallback_' + Utils.generateUniqueId();
                const script = document.createElement('script');
                let isCompleted = false;

                const cleanup = () => {
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                    if (window[callbackName]) {
                        delete window[callbackName];
                    }
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                };

                // グローバルコールバック関数を定義
                window[callbackName] = function(responseData) {
                    if (isCompleted) return;
                    isCompleted = true;
                    cleanup();
                    resolve(responseData);
                };

                // エラーハンドリング
                script.onerror = function() {
                    if (isCompleted) return;
                    isCompleted = true;
                    cleanup();
                    reject(new Error(`カテゴリ "${category}" のデータ取得に失敗`));
                };

                // タイムアウト処理（15秒）
                const timeoutId = setTimeout(() => {
                    if (isCompleted) return;
                    isCompleted = true;
                    cleanup();
                    reject(new Error(`カテゴリ "${category}" のデータ取得がタイムアウト`));
                }, 15000);

                // JSONP リクエスト実行
                script.src = `${this.urls.category}?category=${encodeURIComponent(category)}&callback=${callbackName}`;
                document.head.appendChild(script);
            });

            // キャッシュに保存
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            console.log(`カテゴリ "${category}" のデータ取得完了`);
            return data;

        } catch (error) {
            console.error(`カテゴリ "${category}" のデータ取得に失敗:`, error);
            throw error;
        }
    }

    // 複数カテゴリのデータを並列取得
    async fetchMultipleCategoriesData() {
        try {
            const categories = ['All', '音楽', 'エンターテイメント', 'ゲーム', 'ハウツーとスタイル', 'ペットと動物'];
            const promises = categories.map(category => this.fetchYouTubeDataByCategory(category));
            const results = await Promise.all(promises);

            // カテゴリ別データを整理
            this.categoryData = categories.map((category, index) => ({
                name: category === 'All' ? '全体' : category,
                data: results[index].slice(1), // ヘッダー除去
                color: Utils.getCategoryColor(category),
                rawCategory: category
            }));

            return this.categoryData;

        } catch (error) {
            console.error('複数カテゴリデータの取得に失敗:', error);
            throw error;
        }
    }

    // 全期間最高再生数データを取得
    getAllTimeTopData(limit = 50) {
        const uniqueData = Utils.removeDuplicatesByUrl(this.allYouTubeData);
        return uniqueData
            .sort((a, b) => Number(b[7]) - Number(a[7]))
            .slice(0, limit);
    }

    // 指定日のデータを取得
    getDailyData(selectedDate, limit = 50) {
        const dailyData = this.allYouTubeData
            .filter(row => Utils.getDateOnly(row[0]) === selectedDate)
            .sort((a, b) => Number(a[1]) - Number(b[1])) // 順位順
            .slice(0, limit);

        return dailyData;
    }

    // カテゴリチャート用統計データを準備
    prepareCategoryStatistics() {
        const categories = this.categoryData.filter(cat => cat.name !== '全体');
        
        return categories.map(cat => {
            const viewsStats = Utils.getDataStatistics(cat.data, 7); // 再生数
            const likesStats = Utils.getDataStatistics(cat.data, 8); // 高評価数
            
            return {
                name: cat.name,
                color: cat.color,
                avgViews: viewsStats.avg,
                avgLikes: likesStats.avg,
                totalVideos: cat.data.length,
                maxViews: viewsStats.max,
                maxLikes: likesStats.max
            };
        });
    }

    // キャッシュクリア
    clearCache() {
        this.cache.clear();
        console.log('データキャッシュをクリアしました');
    }

    // ゲッター
    get getAllData() { return this.allYouTubeData; }
    get getCategoryData() { return this.categoryData; }
    get getAvailableDates() { return this.availableDates; }
}