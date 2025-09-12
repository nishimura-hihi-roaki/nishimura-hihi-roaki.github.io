// dataManager.js - 緊急修正版（シンプル化）

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
            const response = await fetch(this.urls.main);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
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

    // カテゴリ別データ取得（超シンプル版）
    async fetchYouTubeDataByCategory(category = "All") {
        return new Promise((resolve) => {
            console.log(`カテゴリ "${category}" のデータ取得中...`);
            
            const callbackName = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const script = document.createElement('script');
            
            // グローバルコールバック（最小限）
            window[callbackName] = (data) => {
                // クリーンアップ
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
                
                console.log(`カテゴリ "${category}" レスポンス受信`, typeof data);
                
                try {
                    // レスポンス変換
                    const result = this.convertResponse(data, category);
                    console.log(`カテゴリ "${category}" 処理完了:`, result.length, '件');
                    resolve(result);
                } catch (error) {
                    console.error('データ変換エラー:', error);
                    // エラーでも空データで解決
                    const headers = ['timestamp', 'rank', 'title', 'channel', 'description', 'category', 'duration', 'views', 'likes', 'comments', 'url'];
                    resolve([headers]);
                }
            };
            
            // タイムアウト処理
            setTimeout(() => {
                if (window[callbackName]) {
                    console.warn(`カテゴリ "${category}" タイムアウト`);
                    window[callbackName]([]);
                }
            }, 10000);
            
            // リクエスト実行
            script.src = `${this.urls.category}?category=${encodeURIComponent(category)}&callback=${callbackName}`;
            document.head.appendChild(script);
        });
    }

    // レスポンス変換（簡単版）
    convertResponse(data, category) {
        const headers = ['timestamp', 'rank', 'title', 'channel', 'description', 'category', 'duration', 'views', 'likes', 'comments', 'url'];
        
        // 空や無効なデータの場合
        if (!data) {
            return [headers];
        }
        
        // 配列の場合
        if (Array.isArray(data)) {
            return data.length > 0 ? data : [headers];
        }
        
        // オブジェクトの場合
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            console.log('オブジェクトのキー:', keys);
            
            if (category === 'All') {
                // 全データ結合
                const result = [headers];
                keys.forEach(key => {
                    const categoryData = data[key];
                    if (Array.isArray(categoryData)) {
                        result.push(...categoryData);
                    }
                });
                return result;
            } else {
                // 特定カテゴリ
                const categoryData = data[category];
                if (Array.isArray(categoryData)) {
                    return [headers, ...categoryData];
                }
            }
        }
        
        // デフォルト
        return [headers];
    }

    // カテゴリ分析データ取得（改良版）
    async fetchMultipleCategoriesData() {
        try {
            console.log('=== カテゴリ分析開始 ===');
            
            // 全データを取得
            const allData = await this.fetchYouTubeDataByCategory('All');
            console.log('全データ取得:', allData.length, '件');
            
            if (!Array.isArray(allData) || allData.length <= 1) {
                console.warn('有効なデータが取得できませんでした');
                return this.createFallbackCategoryData();
            }
            
            // カテゴリを抽出
            const categories = this.extractCategories(allData);
            console.log('発見されたカテゴリ:', categories);
            
            // カテゴリデータを構築
            this.categoryData = [];
            
            // 全体データ
            this.categoryData.push({
                name: '全体',
                data: allData.slice(1), // ヘッダー除外
                color: Utils.getCategoryColor('All'),
                rawCategory: 'All'
            });
            
            // 各カテゴリ別にデータを分割
            categories.forEach((cat, index) => {
                const filteredData = this.filterByCategory(allData, cat);
                console.log(`カテゴリ "${cat}": ${filteredData.length}件`);
                
                if (filteredData.length > 0) { // データがある場合のみ追加
                    this.categoryData.push({
                        name: cat,
                        data: filteredData,
                        color: Utils.getCategoryColor(cat),
                        rawCategory: cat
                    });
                }
            });
            
            console.log('=== カテゴリ分析完了 ===');
            console.log('カテゴリ数:', this.categoryData.length);
            this.categoryData.forEach(cat => {
                console.log(`  ${cat.name}: ${cat.data.length}件`);
            });
            
            return this.categoryData;
            
        } catch (error) {
            console.error('カテゴリ分析エラー:', error);
            return this.createFallbackCategoryData();
        }
    }

    // フォールバックカテゴリデータの作成
    createFallbackCategoryData() {
        this.categoryData = [{
            name: '全体',
            data: [],
            color: Utils.getCategoryColor('All'),
            rawCategory: 'All'
        }, {
            name: '映画とアニメ',
            data: [],
            color: Utils.getCategoryColor('映画とアニメ'),
            rawCategory: '映画とアニメ'
        }];
        return this.categoryData;
    }

    // データからカテゴリ抽出（改良版）
    extractCategories(data) {
        if (!Array.isArray(data) || data.length <= 1) {
            return ['映画とアニメ'];
        }
        
        const cats = new Set();
        
        // 全データをチェックしてカテゴリを抽出
        for (let i = 1; i < data.length; i++) {
            if (data[i] && data[i][4] && data[i][4].trim()) {
                const category = data[i][4].trim();
                cats.add(category);
            }
        }
        
        const result = Array.from(cats);
        console.log('抽出されたカテゴリリスト:', result);
        
        return result.length > 0 ? result : ['映画とアニメ'];
    }

    // カテゴリでフィルタ（改良版）
    filterByCategory(data, category) {
        if (!Array.isArray(data) || data.length <= 1) {
            return [];
        }
        
        const filtered = [];
        console.log(`カテゴリ "${category}" でフィルタリング中...`);
        
        for (let i = 1; i < data.length; i++) {
            if (data[i] && data[i][4]) {
                const rowCategory = data[i][4].trim();
                if (rowCategory === category) {
                    filtered.push(data[i]);
                }
            }
        }
        
        console.log(`カテゴリ "${category}": ${filtered.length}件見つかりました`);
        return filtered;
    }

    // 統計データ準備（デバッグ付き）
    prepareCategoryStatistics() {
        console.log('統計データ準備開始...');
        console.log('対象カテゴリ:', this.categoryData.map(cat => `${cat.name}(${cat.data.length}件)`));
        
        const stats = this.categoryData
            .filter(cat => cat.name !== '全体')
            .map(cat => {
                console.log(`統計計算: ${cat.name}`);
                
                if (!cat.data || cat.data.length === 0) {
                    console.log(`  ${cat.name}: データなし`);
                    return {
                        name: cat.name,
                        color: cat.color,
                        avgViews: 0,
                        avgLikes: 0,
                        totalVideos: 0,
                        maxViews: 0,
                        maxLikes: 0
                    };
                }
                
                // 再生数データを抽出（7番目のカラム）
                const views = cat.data
                    .map(row => {
                        const val = parseFloat(row[7]);
                        return isNaN(val) ? 0 : val;
                    })
                    .filter(v => v > 0);
                
                // 高評価数データを抽出（8番目のカラム）
                const likes = cat.data
                    .map(row => {
                        const val = parseFloat(row[8]);
                        return isNaN(val) ? 0 : val;
                    })
                    .filter(v => v > 0);
                
                const avgViews = views.length > 0 ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0;
                const avgLikes = likes.length > 0 ? Math.round(likes.reduce((a, b) => a + b, 0) / likes.length) : 0;
                
                console.log(`  ${cat.name}: 動画${cat.data.length}件, 平均再生数${avgViews}, 平均高評価${avgLikes}`);
                
                return {
                    name: cat.name,
                    color: cat.color,
                    avgViews: avgViews,
                    avgLikes: avgLikes,
                    totalVideos: cat.data.length,
                    maxViews: views.length > 0 ? Math.max(...views) : 0,
                    maxLikes: likes.length > 0 ? Math.max(...likes) : 0
                };
            });
        
        console.log('統計データ完成:', stats.map(s => `${s.name}: ${s.totalVideos}件`));
        return stats;
    }

    // その他のメソッド（変更なし）
    getAllTimeTopData(limit = 50) {
        const uniqueData = Utils.removeDuplicatesByUrl(this.allYouTubeData);
        return uniqueData
            .sort((a, b) => Number(b[7]) - Number(a[7]))
            .slice(0, limit);
    }

    getDailyData(selectedDate, limit = 50) {
        const dailyData = this.allYouTubeData
            .filter(row => Utils.getDateOnly(row[0]) === selectedDate)
            .sort((a, b) => Number(a[1]) - Number(b[1]))
            .slice(0, limit);
        return dailyData;
    }

    clearCache() {
        this.cache.clear();
        console.log('データキャッシュをクリアしました');
    }

    // ゲッター
    get getAllData() { return this.allYouTubeData; }
    get getCategoryData() { return this.categoryData; }
    get getAvailableDates() { return this.availableDates; }
}